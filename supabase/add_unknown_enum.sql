-- ============================================================================
-- Add 'unknown' to hazard_level enum
-- ============================================================================
-- This migration adds 'unknown' as a valid hazard_level value
-- Run this BEFORE updating frontend code
-- ============================================================================

-- Add 'unknown' value to hazard_level enum
-- Note: PostgreSQL doesn't support removing enum values, so this is permanent
ALTER TYPE hazard_level ADD VALUE IF NOT EXISTS 'unknown';

-- Verify the enum now includes 'unknown'
-- You can check with: SELECT unnest(enum_range(NULL::hazard_level));
