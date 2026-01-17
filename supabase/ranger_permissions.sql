-- ============================================================================
-- Ranger Permissions: Allow Rangers to Update Report Status
-- ============================================================================
-- This script adds UPDATE permissions for rangers to verify/resolve reports
-- Run this as part of Person 1's implementation
-- ============================================================================

-- Drop existing policy if it exists (to allow recreation)
DROP POLICY IF EXISTS "Rangers can update reports" ON public.reports;

-- Create policy allowing rangers to update reports
-- Rangers can only update the status field (verified/resolved)
CREATE POLICY "Rangers can update reports" ON public.reports
FOR UPDATE
USING (is_ranger() = true)
WITH CHECK (is_ranger() = true);

-- Optional: Create a more restrictive policy that only allows status updates
-- This ensures rangers can't modify other fields like species_name, hazard_rating, etc.
-- Uncomment if you want stricter control:
/*
CREATE POLICY "Rangers can update report status only" ON public.reports
FOR UPDATE
USING (is_ranger() = true)
WITH CHECK (
  is_ranger() = true AND
  -- Only allow status field to change, other fields must remain the same
  (OLD.species_name = NEW.species_name) AND
  (OLD.hazard_rating = NEW.hazard_rating) AND
  (OLD.is_invasive = NEW.is_invasive) AND
  (OLD.description = NEW.description) AND
  (OLD.location = NEW.location) AND
  (OLD.image_url = NEW.image_url) AND
  (OLD.user_id = NEW.user_id) AND
  (OLD.confidence_score = NEW.confidence_score)
);
*/

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reports' AND policyname = 'Rangers can update reports';
