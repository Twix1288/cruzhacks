-- ============================================================================
-- Diagnostic Script - Check What Migration Actually Did
-- ============================================================================
-- Run this to see what exists in your database RIGHT NOW
-- ============================================================================

-- 1. Check if functions exist
SELECT 
    '=== FUNCTIONS CHECK ===' as section;
    
SELECT 
    routine_name as function_name,
    routine_type,
    CASE WHEN routine_name IN ('is_ranger', 'handle_new_user', 'award_xp_and_check_achievements', 'on_report_created') 
         THEN '✅ REQUIRED FUNCTION EXISTS'
         ELSE '⚠️ EXTRA FUNCTION'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 2. Check if triggers exist
SELECT 
    '=== TRIGGERS CHECK ===' as section;
    
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation,
    CASE WHEN trigger_name IN ('on_auth_user_created', 'trigger_award_xp_on_report')
         THEN '✅ REQUIRED TRIGGER EXISTS'
         ELSE '⚠️ EXTRA TRIGGER'
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 3. Check RLS status
SELECT 
    '=== RLS STATUS CHECK ===' as section;
    
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('reports', 'profiles', 'achievements')
ORDER BY tablename;

-- 4. Check RLS policies
SELECT 
    '=== RLS POLICIES CHECK ===' as section;
    
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN tablename = 'reports' AND policyname IN ('Students see own reports', 'Rangers see threats', 'Universal Insert')
            THEN '✅ REQUIRED POLICY'
        WHEN tablename = 'profiles' AND policyname IN ('Public profiles', 'Users update own profile')
            THEN '✅ REQUIRED POLICY'
        WHEN tablename = 'achievements' AND policyname IN ('Users see own achievements', 'System can insert achievements')
            THEN '✅ REQUIRED POLICY'
        ELSE '⚠️ EXTRA POLICY'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('reports', 'profiles', 'achievements')
ORDER BY tablename, policyname;

-- 5. Check achievements table constraint
SELECT 
    '=== ACHIEVEMENTS CONSTRAINT CHECK ===' as section;
    
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    CASE WHEN conname = 'achievements_user_id_achievement_key_key'
         THEN '✅ UNIQUE CONSTRAINT EXISTS'
         ELSE '❌ MISSING UNIQUE CONSTRAINT'
    END as status
FROM pg_constraint
WHERE conrelid = 'public.achievements'::regclass
AND contype = 'u';

-- 6. Check if xp_points column exists
SELECT 
    '=== PROFILES TABLE CHECK ===' as section;
    
SELECT 
    column_name,
    data_type,
    CASE WHEN column_name = 'xp_points'
         THEN '✅ XP_POINTS COLUMN EXISTS'
         ELSE 'Column'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. FINAL SUMMARY
SELECT 
    '=== MIGRATION STATUS SUMMARY ===' as section;

WITH checks AS (
    SELECT 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'award_xp_and_check_achievements'
        ) THEN 1 ELSE 0 END as has_xp_function,
        
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_schema = 'public' 
            AND trigger_name = 'trigger_award_xp_on_report'
        ) THEN 1 ELSE 0 END as has_xp_trigger,
        
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'public.achievements'::regclass
            AND conname = 'achievements_user_id_achievement_key_key'
        ) THEN 1 ELSE 0 END as has_unique_constraint,
        
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'xp_points'
        ) THEN 1 ELSE 0 END as has_xp_column
)
SELECT 
    CASE 
        WHEN has_xp_function = 1 AND has_xp_trigger = 1 AND has_unique_constraint = 1 AND has_xp_column = 1
        THEN '✅✅✅ MIGRATION COMPLETE - Everything is set up correctly!'
        ELSE CONCAT(
            '⚠️ MIGRATION INCOMPLETE: ',
            CASE WHEN has_xp_function = 0 THEN 'Missing XP function. ' ELSE '' END,
            CASE WHEN has_xp_trigger = 0 THEN 'Missing XP trigger. ' ELSE '' END,
            CASE WHEN has_unique_constraint = 0 THEN 'Missing unique constraint. ' ELSE '' END,
            CASE WHEN has_xp_column = 0 THEN 'Missing xp_points column. ' ELSE '' END
        )
    END as migration_status
FROM checks;
