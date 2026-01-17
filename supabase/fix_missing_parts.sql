-- ============================================================================
-- Fix Missing Migration Parts
-- ============================================================================
-- Run this if migration.sql didn't complete fully
-- ============================================================================

-- 1. Add xp_points column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'xp_points'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN xp_points integer DEFAULT 0;
        RAISE NOTICE 'Added xp_points column to profiles';
    ELSE
        RAISE NOTICE 'xp_points column already exists';
    END IF;
END $$;

-- 2. Add UNIQUE constraint to achievements if missing
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
        RAISE NOTICE 'Added UNIQUE constraint to achievements';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists on achievements';
    END IF;
END $$;

-- 3. Create is_ranger function
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

-- 4. Create handle_new_user function
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
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 5. Create award_xp_and_check_achievements function
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

-- 6. Create on_report_created trigger function
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
    WHEN 'unknown' THEN v_hazard_bonus := 0; -- Unknown reports still get base XP but no hazard bonus
    WHEN 'low' THEN v_hazard_bonus := 0;
    WHEN 'safe' THEN v_hazard_bonus := 0;
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

-- 7. Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trigger_award_xp_on_report ON public.reports;
CREATE TRIGGER trigger_award_xp_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.on_report_created();

-- 8. Enable RLS and create missing policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Students see own reports" ON public.reports;
DROP POLICY IF EXISTS "Universal Insert" ON public.reports;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users see own achievements" ON public.achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON public.achievements;

-- Reports Policies
CREATE POLICY "Students see own reports" ON public.reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Universal Insert" ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Profiles Policies
CREATE POLICY "Public profiles" ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Achievements Policies
CREATE POLICY "Users see own achievements" ON public.achievements
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.achievements
FOR INSERT 
WITH CHECK (true);

-- Success message
SELECT '✅ All missing parts have been added!' as status;
