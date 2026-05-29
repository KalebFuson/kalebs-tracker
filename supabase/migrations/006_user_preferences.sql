-- =============================================================================
-- Migration 006 — user_preferences table
-- =============================================================================
-- Stores per-user notification preferences and timezone setting.
-- Uses upsert semantics in the app — insert on first save, update thereafter.
--
-- HOW TO APPLY
--   Paste into Supabase Dashboard → SQL Editor and run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id                      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone                     text        NOT NULL DEFAULT 'America/New_York',
  notify_task_assigned_email   boolean     NOT NULL DEFAULT true,
  notify_mentions_email        boolean     NOT NULL DEFAULT true,
  notify_daily_digest_email    boolean     NOT NULL DEFAULT false,
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_preferences_select ON public.user_preferences;
CREATE POLICY user_preferences_select ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_insert ON public.user_preferences;
CREATE POLICY user_preferences_insert ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_update ON public.user_preferences;
CREATE POLICY user_preferences_update ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
