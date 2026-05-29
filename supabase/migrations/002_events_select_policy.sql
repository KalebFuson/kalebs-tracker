-- =============================================================================
-- Migration 002 — Add SELECT policy for events table
-- =============================================================================
-- The initial schema (001) made events write-only (INSERT only) for v1.
-- This migration adds a SELECT policy so the dashboard activity feed can read
-- events scoped to the current user's organizations.
--
-- HOW TO APPLY
--   Paste into Supabase Dashboard → SQL Editor and run.
-- =============================================================================

DROP POLICY IF EXISTS events_select ON public.events;
CREATE POLICY events_select ON public.events
  FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));
