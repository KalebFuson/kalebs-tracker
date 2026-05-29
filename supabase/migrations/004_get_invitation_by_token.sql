-- =============================================================================
-- Migration 004 — SECURITY DEFINER function for public invitation lookup
-- =============================================================================
-- The invitations_select policy restricts reads to org admins.
-- This function bypasses RLS so that un-authenticated visitors can look up
-- an invitation by its one-time token (e.g. to render the accept-invite page).
--
-- It is intentionally scoped to token lookup only and returns no sensitive data
-- beyond what is needed to render the page (no invited_by user_id, no raw token).
--
-- HOW TO APPLY
--   Paste into Supabase Dashboard → SQL Editor and run.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS TABLE (
  id              uuid,
  org_id          uuid,
  email           text,
  role            text,
  default_team_ids uuid[],
  expires_at      timestamptz,
  accepted_at     timestamptz,
  org_name        text,
  org_slug        text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.org_id,
    i.email,
    i.role,
    i.default_team_ids,
    i.expires_at,
    i.accepted_at,
    o.name  AS org_name,
    o.slug  AS org_slug
  FROM public.invitations i
  INNER JOIN public.organizations o ON o.id = i.org_id
  WHERE i.token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
