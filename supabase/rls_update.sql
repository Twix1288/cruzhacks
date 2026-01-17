-- Update RLS Policies for Proper Role-Based Filtering
-- Run this SQL file to update the existing policies

-- Drop existing ranger policy
DROP POLICY IF EXISTS "Rangers see threats" ON public.reports;

-- Create updated policy: Rangers see medium/high/critical hazard invasive species from everyone
CREATE POLICY "Rangers see threats" ON public.reports 
FOR SELECT 
USING ( 
  is_ranger() = true 
  AND is_invasive = true 
  AND hazard_rating IN ('medium', 'high', 'critical') 
);

-- Verify existing scout policy (should already be correct)
-- Scouts see ONLY their own reports
-- Policy "Students see own reports" should already exist and be correct

-- Verify the is_ranger() function exists
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
