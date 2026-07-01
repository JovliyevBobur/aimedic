-- Sync profiles.role from user_roles table for all doctors
-- This fixes the issue where user_roles has 'doctor' role but profiles.role is still 'user'
UPDATE public.profiles p
SET role = 'doctor'
FROM public.user_roles ur
WHERE ur.user_id = p.user_id
  AND ur.role = 'doctor'::app_role
  AND (p.role IS NULL OR p.role != 'doctor');

-- Also sync patient roles
UPDATE public.profiles p
SET role = 'patient'
FROM public.user_roles ur
WHERE ur.user_id = p.user_id
  AND ur.role = 'patient'::app_role
  AND (p.role IS NULL OR p.role = 'user');

-- Create a trigger to auto-sync profiles.role when user_roles changes
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- When a doctor or patient role is added, update profiles.role
  IF NEW.role IN ('doctor'::app_role, 'patient'::app_role, 'admin'::app_role) THEN
    UPDATE public.profiles
    SET role = NEW.role::text
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_from_user_roles();
