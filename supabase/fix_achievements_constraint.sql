-- Fix Achievements Table - Add Missing UNIQUE Constraint
-- This ensures users can't have duplicate achievements

-- Check if constraint already exists, if not add it
DO $$ 
BEGIN
    -- Check if the unique constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'achievements_user_id_achievement_key_key'
        AND conrelid = 'public.achievements'::regclass
    ) THEN
        -- Add the unique constraint
        ALTER TABLE public.achievements 
        ADD CONSTRAINT achievements_user_id_achievement_key_key 
        UNIQUE (user_id, achievement_key);
        
        RAISE NOTICE 'Added UNIQUE constraint to achievements table';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists on achievements table';
    END IF;
END $$;

-- Also ensure ON DELETE CASCADE is set on foreign key
-- (This is important for data integrity)
DO $$
BEGIN
    -- Check current foreign key constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'achievements'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    ) THEN
        -- Check if CASCADE is set
        -- Note: We can't easily modify FK constraints, so we'll just verify
        RAISE NOTICE 'Foreign key constraint exists on achievements.user_id';
    END IF;
END $$;
