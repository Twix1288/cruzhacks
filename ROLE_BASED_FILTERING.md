# Role-Based Map Filtering & Database Connections

## Overview
The map now properly filters reports based on user roles using Row Level Security (RLS) policies in Supabase and client-side verification.

## Role-Based Filtering Rules

### Scouts
- **See**: Only their own reports
- **RLS Policy**: `auth.uid() = user_id`
- **Client-side**: Additional verification filters by `user_id`

### Rangers
- **See**: Medium/High/Critical hazard invasive species reports from **everyone**
- **RLS Policy**: `is_ranger() = true AND is_invasive = true AND hazard_rating IN ('medium', 'high', 'critical')`
- **Client-side**: Additional verification ensures only invasive species with medium+ hazard ratings

## Database Setup

### 1. Update RLS Policies
Run the SQL file: `supabase/rls_update.sql`

This will:
- Drop the old ranger policy
- Create the new policy for rangers (medium/high/critical invasive species only)
- Verify the scout policy (already correct)
- Ensure the `is_ranger()` function exists

### 2. Schema File
The main schema file (`supabase/schema.sql`) has been updated with the correct policy.

## Implementation Details

### SmartMap Component
The `SmartMap` component now:
1. **Fetches user role** on mount
2. **Applies RLS filtering** automatically via Supabase queries
3. **Verifies client-side** as a backup security measure
4. **Filters realtime updates** based on role

### Key Features
- **Automatic filtering**: RLS policies handle filtering at the database level
- **Client-side verification**: Additional filtering ensures security
- **Realtime updates**: New reports are filtered based on role before being added to the map
- **Role detection**: Component fetches user role from profiles table

## Testing

### For Scouts:
1. Login as a scout
2. Create a report
3. Verify only your own reports appear on the map
4. Other scouts' reports should not be visible

### For Rangers:
1. Login as a ranger
2. Verify you only see:
   - Reports where `is_invasive = true`
   - AND `hazard_rating` is 'medium', 'high', or 'critical'
   - From all users (not just your own)
3. Low hazard or non-invasive reports should not appear

## Security Notes

- **RLS is primary**: Database-level security is the main protection
- **Client-side is backup**: Additional filtering provides defense in depth
- **Realtime filtering**: New reports are filtered before being added to state
- **Role verification**: User role is fetched from authenticated session

## Files Modified

1. `supabase/schema.sql` - Updated RLS policy for rangers
2. `supabase/rls_update.sql` - SQL migration file for existing databases
3. `src/components/map/SmartMap.tsx` - Added role-based filtering logic
4. `src/types/index.ts` - Already correct (includes 'unknown' in HazardLevel)

## Next Steps

1. Run `supabase/rls_update.sql` in your Supabase SQL editor
2. Test with both scout and ranger accounts
3. Verify filtering works correctly for both roles
4. Monitor console logs for debugging information
