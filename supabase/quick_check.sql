-- Quick Check - Did Migration Work?
-- Run this to see if migration.sql actually created everything

-- Check 1: Do we have the XP function?
SELECT 
    'XP Function' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'award_xp_and_check_achievements'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Check 2: Do we have the XP trigger?
SELECT 
    'XP Trigger' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_schema = 'public' 
            AND trigger_name = 'trigger_award_xp_on_report'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Check 3: Do we have the unique constraint on achievements?
SELECT 
    'Achievements Unique Constraint' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'public.achievements'::regclass
            AND conname = 'achievements_user_id_achievement_key_key'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Check 4: Do we have xp_points column?
SELECT 
    'XP Points Column' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'xp_points'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Check 5: Do we have the ranger policy?
SELECT 
    'Ranger RLS Policy' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
            AND tablename = 'reports'
            AND policyname = 'Rangers see threats'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;
