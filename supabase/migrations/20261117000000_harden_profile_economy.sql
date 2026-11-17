-- Harden XP / points / premium / reward state against client-side tampering.
--
-- Found by running every migration into a real Postgres + PostgREST and calling
-- it as signed-in users:
--   1. Any UPDATE on profiles failed: protect_super_admin_trigger (from
--      20260120070000) still ran on profiles and reads OLD.role, a column that
--      no longer exists. That broke profile edits, Premium redeem and award-xp.
--   2. RLS let a user PATCH their own xp, points, is_premium and premium_until.
--   3. A user could reset user_progress.reward_claimed and claim again.
--   4. A user could insert or edit their own user_quiz_attempts rows (fake scores).
--      The validate-quiz-answers function writes attempts with the service role.
--   5. user_roles.prevent_moderator_role rejected the 'superadmin' role.
-- Additive: no data is changed or deleted.

-- 1. Remove the broken trigger from profiles (the user_roles one is separate).
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.profiles;

-- 2. Only the server (service role, SECURITY DEFINER functions) or an admin may
--    change economy columns. The name sorts before the streak trigger so it sees
--    the client's raw values, not the streak trigger's computed ones.
CREATE OR REPLACE FUNCTION public.guard_profile_economy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.check_is_admin() THEN
    IF NEW.xp IS DISTINCT FROM OLD.xp
       OR NEW.points IS DISTINCT FROM OLD.points
       OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
       OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
       OR NEW.current_streak IS DISTINCT FROM OLD.current_streak
       OR NEW.longest_streak IS DISTINCT FROM OLD.longest_streak
       OR NEW.labels IS DISTINCT FROM OLD.labels THEN
      RAISE EXCEPTION 'xp, points, premium, streak and labels are managed by the server'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS a00_guard_profile_economy ON public.profiles;
CREATE TRIGGER a00_guard_profile_economy
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_economy();

-- Premium redeem moves server-side with the same offers and rules the Premium tab used.
CREATE OR REPLACE FUNCTION public.redeem_premium(p_offer_id text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cost integer;
  v_days integer;
  v_streak_required integer := 0;
  v_profile public.profiles%ROWTYPE;
  v_base timestamptz;
  v_until timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_offer_id = '7_days' THEN v_cost := 500; v_days := 7;
  ELSIF p_offer_id = '30_days' THEN v_cost := 1500; v_days := 30;
  ELSIF p_offer_id = 'streak_claim' THEN v_cost := 0; v_days := 14; v_streak_required := 30;
  ELSE RAISE EXCEPTION 'Unknown premium offer';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  IF v_cost > 0 AND COALESCE(v_profile.points, 0) < v_cost THEN
    RAISE EXCEPTION 'Not enough points';
  END IF;
  IF v_streak_required > 0 AND COALESCE(v_profile.current_streak, 0) < v_streak_required THEN
    RAISE EXCEPTION 'Streak has not reached 30 days';
  END IF;

  v_base := GREATEST(COALESCE(v_profile.premium_until, now()), now());
  v_until := v_base + make_interval(days => v_days);

  UPDATE public.profiles
     SET is_premium = true,
         premium_until = v_until,
         points = COALESCE(points, 0) - v_cost
   WHERE id = v_uid;

  RETURN v_until;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_premium(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_premium(text) TO authenticated;

-- 3. Users must not flip reward_claimed (award-xp sets it with the service role).
CREATE OR REPLACE FUNCTION public.guard_progress_reward()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.check_is_admin() THEN
    IF TG_OP = 'INSERT' AND COALESCE(NEW.reward_claimed, false) THEN
      RAISE EXCEPTION 'reward_claimed is managed by the server' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.reward_claimed IS DISTINCT FROM OLD.reward_claimed THEN
      RAISE EXCEPTION 'reward_claimed is managed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_progress_reward ON public.user_progress;
CREATE TRIGGER guard_progress_reward
  BEFORE INSERT OR UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.guard_progress_reward();

-- 4. Quiz attempts are written only by validate-quiz-answers (service role).
DROP POLICY IF EXISTS allow_insert_for_owner ON public.user_quiz_attempts;
DROP POLICY IF EXISTS allow_update_for_owner ON public.user_quiz_attempts;

-- 5. Allow the superadmin role the app already uses.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS prevent_moderator_role;
ALTER TABLE public.user_roles ADD CONSTRAINT prevent_moderator_role
  CHECK (role = ANY (ARRAY['user'::app_role, 'tutor'::app_role, 'admin'::app_role, 'superadmin'::app_role]));

-- Make PostgREST pick up the new function straight away.
NOTIFY pgrst, 'reload schema';
