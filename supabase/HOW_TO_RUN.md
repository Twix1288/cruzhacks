# How to Run Migration.sql in Supabase

## What You're Seeing

The schema dump you're seeing (with `USER-DEFINED` placeholders) is **NOT** the migration script. It's Supabase's schema export/viewer showing your current database structure.

## How to Actually Run Migration.sql

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Paste Migration.sql
1. Open the file: `supabase/migration.sql`
2. Copy **ALL** the contents (all 382 lines)
3. Paste into the Supabase SQL Editor

### Step 3: Run the Migration
1. Click the **Run** button (or press Cmd/Ctrl + Enter)
2. Wait for execution to complete
3. You should see: "Success. No rows returned" or similar success message

### Step 4: Verify Migration Success
1. Run the verification script: `supabase/verify_migration.sql`
2. Check the results - you should see:
   - ✅ All functions exist
   - ✅ All triggers exist
   - ✅ RLS is enabled
   - ✅ All policies exist
   - ✅ UNIQUE constraint exists

## Expected Output

When you run `migration.sql`, you should see:
- Success messages for each step
- No errors (if there are errors, they'll be shown)
- Final message: "Success" or "No rows returned"

## What Migration.sql Does

The migration script will:
1. ✅ Create enums (if they don't exist)
2. ✅ Add `xp_points` column to profiles (if missing)
3. ✅ Create achievements table (if it doesn't exist)
4. ✅ Add UNIQUE constraint to achievements
5. ✅ Create all functions (is_ranger, handle_new_user, award_xp_and_check_achievements, on_report_created)
6. ✅ Create triggers (on_auth_user_created, trigger_award_xp_on_report)
7. ✅ Enable RLS on all tables
8. ✅ Create/update all RLS policies

## Troubleshooting

### If you see errors:
1. **"relation already exists"** - This is OK, the script uses `IF NOT EXISTS`
2. **"permission denied"** - Make sure you're running as the database owner
3. **"function already exists"** - This is OK, the script uses `CREATE OR REPLACE`

### If migration seems to do nothing:
- The script is designed to be idempotent (safe to run multiple times)
- It only adds what's missing
- Run `verify_migration.sql` to check what was actually created

## After Migration

Once migration is complete:
1. ✅ XP system will automatically award XP when reports are created
2. ✅ Achievements will unlock automatically
3. ✅ RLS policies will filter reports by role
4. ✅ User profiles will be created automatically on signup

## Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied entire `migration.sql` file
- [ ] Pasted into SQL Editor
- [ ] Clicked Run
- [ ] Saw success message
- [ ] Ran `verify_migration.sql` to confirm
- [ ] All checks passed ✅
