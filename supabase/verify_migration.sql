-- ============================================================================
-- Verify Migration Success
-- ============================================================================
-- Run this AFTER migration.sql to verify everything was set up correctly
-- ============================================================================

-- Check if functions exist
SELECT 
    'Functions' as check_type,
    routine_name as item_name,
    'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('is_ranger', 'handle_new_user', 'award_xp_and_check_achievements', 'on_report_created')
ORDER BY routine_name;

-- Check if triggers exist
SELECT 
    'Triggers' as check_type,
    trigger_name as item_name,
    'EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name IN ('on_auth_user_created', 'trigger_award_xp_on_report')
ORDER BY trigger_name;

-- Check if RLS is enabled
SELECT 
    'RLS Status' as check_type,
    tablename as item_name,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('reports', 'profiles', 'achievements')
ORDER BY tablename;

-- Check if policies exist
SELECT 
    'RLS Policies' as check_type,
    schemaname || '.' || tablename || '.' || policyname as item_name,
    'EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('reports', 'profiles', 'achievements')
ORDER BY tablename, policyname;

-- Check achievements table constraint
SELECT 
    'Constraints' as check_type,
    conname as item_name,
    'EXISTS' as status
FROM pg_constraint
WHERE conrelid = 'public.achievements'::regclass
AND conname = 'achievements_user_id_achievement_key_key';

-- Summary
SELECT 
    'SUMMARY' as check_type,
    'Migration Status' as item_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'award_xp_and_check_achievements'
        ) 
        AND EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_schema = 'public' 
            AND trigger_name = 'trigger_award_xp_on_report'
        )
        AND EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'public.achievements'::regclass
            AND conname = 'achievements_user_id_achievement_key_key'
        )
        THEN '✅ MIGRATION SUCCESSFUL'
        ELSE '❌ MIGRATION INCOMPLETE - Check errors above'
    END as status;
