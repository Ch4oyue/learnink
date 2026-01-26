-- Part 1: Add Superadmin to Enum
-- This must be run separately and committed before using the value.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
