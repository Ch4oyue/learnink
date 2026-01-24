-- =============================================
-- Audit Role Changes Trigger
-- Created: 2026-01-24
-- Purpose: Automatically log all role changes to role_change_history
-- =============================================

CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if the role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_history (user_id, old_role, new_role, changed_by, created_at)
    VALUES (NEW.user_id, OLD.role, NEW.role, auth.uid(), now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for UPDATE
DROP TRIGGER IF EXISTS log_role_change_trigger ON user_roles;
CREATE TRIGGER log_role_change_trigger
AFTER UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION log_role_change();

-- Trigger for INSERT (optional, but good for tracking initial assignment if needed, though usually 'user' is default)
-- Let's stick to UPDATE as per request "role change history".
-- If we want to track when someone is *given* a role for the first time (other than default), we could add it.
-- But standard flow is: signUp -> default 'user' role inserted.
-- Then Admin changes it to 'tutor' -> UPDATE.
-- So UPDATE trigger is sufficient for "changes".
