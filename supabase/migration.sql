-- ============================================================================
-- CanopyCheck Database Migration Script
-- ============================================================================
-- This script adds missing features to an existing database WITHOUT dropping data
-- Safe to run on production databases with existing data
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS (if not already installed)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 2. ENUMS (create if they don't exist)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE hazard_level AS ENUM ('safe', 'low', 'medium', 'high', 'critical', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add 'unknown' to existing enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'unknown' value exists in enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'unknown' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'hazard_level')
    ) THEN
        ALTER TYPE hazard_level ADD VALUE 'unknown';
    END IF;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'verified', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add xp_points to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'xp_points'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN xp_points integer DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- 4. CREATE MISSING TABLES
-- ============================================================================

-- Achievements table (create if doesn't exist)
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamptz DEFAULT now()
);

-- Add UNIQUE constraint if it doesn't exist (prevents duplicate achievements)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'achievements_user_id_achievement_key_key'
        AND conrelid = 'public.achievements'::regclass
    ) THEN
        ALTER TABLE public.achievements 
        ADD CONSTRAINT achievements_user_id_achievement_key_key 
        UNIQUE (user_id, achievement_key);
    END IF;
END $$;

-- ============================================================================
-- 5. FUNCTIONS (create or replace)
-- ============================================================================

-- Function to check if current user is a ranger
CREATE OR REPLACE FUNCTION public.is_ranger() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'ranger'
  );
$$;

-- Function to handle new user creation (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username',
    COALESCE(new.raw_user_meta_data ->> 'role', 'scout'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists
  RETURN new;
END;
$$;

-- Function to award XP and check achievements
CREATE OR REPLACE FUNCTION public.award_xp_and_check_achievements(
  p_user_id uuid,
  p_xp_amount integer,
  p_is_invasive boolean DEFAULT false,
  p_hazard_rating text DEFAULT 'low'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp integer;
  v_total_reports integer;
  v_unlocked_achievements text[] := ARRAY[]::text[];
  v_achievement_key text;
BEGIN
  -- Award XP
  UPDATE public.profiles
  SET xp_points = xp_points + p_xp_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING xp_points INTO v_new_xp;

  -- Get total report count for this user
  SELECT COUNT(*) INTO v_total_reports
  FROM public.reports
  WHERE user_id = p_user_id;

  -- Check and unlock achievements based on milestones
  -- First Sighting (1 report)
  IF v_total_reports = 1 THEN
    v_achievement_key := 'first_sighting';
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (p_user_id, v_achievement_key)
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING achievement_key INTO v_achievement_key;
    IF v_achievement_key IS NOT NULL THEN
      v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
    END IF;
  END IF;

  -- Explorer (10 reports)
  IF v_total_reports = 10 THEN
    v_achievement_key := 'explorer';
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (p_user_id, v_achievement_key)
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING achievement_key INTO v_achievement_key;
    IF v_achievement_key IS NOT NULL THEN
      v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
    END IF;
  END IF;

  -- Veteran Scout (50 reports)
  IF v_total_reports = 50 THEN
    v_achievement_key := 'veteran_scout';
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (p_user_id, v_achievement_key)
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING achievement_key INTO v_achievement_key;
    IF v_achievement_key IS NOT NULL THEN
      v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
    END IF;
  END IF;

  -- Invasive Hunter (first invasive species detected)
  IF p_is_invasive THEN
    SELECT COUNT(*) INTO v_total_reports
    FROM public.reports
    WHERE user_id = p_user_id AND is_invasive = true;
    
    IF v_total_reports = 1 THEN
      v_achievement_key := 'invasive_hunter';
      INSERT INTO public.achievements (user_id, achievement_key)
      VALUES (p_user_id, v_achievement_key)
      ON CONFLICT (user_id, achievement_key) DO NOTHING
      RETURNING achievement_key INTO v_achievement_key;
      IF v_achievement_key IS NOT NULL THEN
        v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
      END IF;
    END IF;
  END IF;

  -- Fire Watch (critical hazard detected)
  IF p_hazard_rating = 'critical' THEN
    v_achievement_key := 'fire_watch';
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (p_user_id, v_achievement_key)
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING achievement_key INTO v_achievement_key;
    IF v_achievement_key IS NOT NULL THEN
      v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
    END IF;
  END IF;

  -- XP Milestones
  IF v_new_xp >= 100 AND v_new_xp - p_xp_amount < 100 THEN
    v_achievement_key := 'century_club';
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (p_user_id, v_achievement_key)
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING achievement_key INTO v_achievement_key;
    IF v_achievement_key IS NOT NULL THEN
      v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
    END IF;
  END IF;

  IF v_new_xp >= 500 AND v_new_xp - p_xp_amount < 500 THEN
    v_achievement_key := 'master_scout';
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (p_user_id, v_achievement_key)
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING achievement_key INTO v_achievement_key;
    IF v_achievement_key IS NOT NULL THEN
      v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
    END IF;
  END IF;

  IF v_new_xp >= 1000 AND v_new_xp - p_xp_amount < 1000 THEN
    v_achievement_key := 'legend';
    INSERT INTO public.achievements (user_id, achievement_key)
    VALUES (p_user_id, v_achievement_key)
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING achievement_key INTO v_achievement_key;
    IF v_achievement_key IS NOT NULL THEN
      v_unlocked_achievements := array_append(v_unlocked_achievements, v_achievement_key);
    END IF;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'new_xp', v_new_xp,
    'xp_awarded', p_xp_amount,
    'unlocked_achievements', v_unlocked_achievements
  );
END;
$$;

-- Trigger function to automatically award XP when a report is created
CREATE OR REPLACE FUNCTION public.on_report_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_xp integer := 50;
  v_confidence_bonus integer := 0;
  v_invasive_bonus integer := 0;
  v_hazard_bonus integer := 0;
  v_total_xp integer;
  v_result jsonb;
BEGIN
  -- Calculate XP bonuses based on report quality and findings
  
  -- Confidence bonus (up to +25 XP for high confidence)
  IF NEW.confidence_score IS NOT NULL THEN
    v_confidence_bonus := FLOOR(NEW.confidence_score * 25)::integer;
  END IF;

  -- Invasive species bonus (+50 XP for detecting invasive species)
  IF NEW.is_invasive = true THEN
    v_invasive_bonus := 50;
  END IF;

  -- Hazard rating bonus
  CASE NEW.hazard_rating
    WHEN 'critical' THEN v_hazard_bonus := 25;
    WHEN 'high' THEN v_hazard_bonus := 15;
    WHEN 'medium' THEN v_hazard_bonus := 10;
    ELSE v_hazard_bonus := 0;
  END CASE;

  -- Calculate total XP
  v_total_xp := v_base_xp + v_confidence_bonus + v_invasive_bonus + v_hazard_bonus;

  -- Award XP and check achievements
  v_result := public.award_xp_and_check_achievements(
    NEW.user_id,
    v_total_xp,
    NEW.is_invasive,
    NEW.hazard_rating::text
  );

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS (create or replace)
-- ============================================================================

-- Trigger: Create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Award XP when report is created
DROP TRIGGER IF EXISTS trigger_award_xp_on_report ON public.reports;
CREATE TRIGGER trigger_award_xp_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.on_report_created();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) - Enable and Update Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean updates)
DROP POLICY IF EXISTS "Students see own reports" ON public.reports;
DROP POLICY IF EXISTS "Rangers see threats" ON public.reports;
DROP POLICY IF EXISTS "Universal Insert" ON public.reports;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users see own achievements" ON public.achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON public.achievements;

-- Reports Policies
-- POLICY: Scouts see ONLY their own reports
CREATE POLICY "Students see own reports" ON public.reports 
FOR SELECT 
USING (auth.uid() = user_id);

-- POLICY: Rangers see medium/high/critical hazard invasive species from everyone
CREATE POLICY "Rangers see threats" ON public.reports 
FOR SELECT 
USING ( 
  is_ranger() = true 
  AND is_invasive = true 
  AND hazard_rating IN ('medium', 'high', 'critical') 
);

-- POLICY: Anyone authenticated can insert their own reports
CREATE POLICY "Universal Insert" ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Profiles Policies
-- POLICY: Profiles are viewable by everyone (for leaderboards/avatars)
CREATE POLICY "Public profiles" ON public.profiles
FOR SELECT
USING (true);

-- POLICY: Users can update their own profile
CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Achievements Policies
-- POLICY: Users can see their own achievements
CREATE POLICY "Users see own achievements" ON public.achievements
FOR SELECT 
USING (auth.uid() = user_id);

-- POLICY: System can insert achievements (via trigger/function)
CREATE POLICY "System can insert achievements" ON public.achievements
FOR INSERT 
WITH CHECK (true);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
