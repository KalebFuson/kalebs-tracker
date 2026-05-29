-- =============================================================================
-- Migration 003 — Broaden invitations INSERT policy
-- =============================================================================
-- v1 allowed only org admins to send invitations.
-- This broadens it so any org member who is also a member of at least one team
-- in the org can invite others (team leads, etc.).
-- RLS on INSERT still enforces invited_by = auth.uid().
--
-- HOW TO APPLY
--   Paste into Supabase Dashboard → SQL Editor and run.
-- =============================================================================

DROP POLICY IF EXISTS invitations_insert ON public.invitations;

CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      public.is_org_admin(org_id)
      OR EXISTS (
        SELECT 1
        FROM public.team_members tm
        INNER JOIN public.teams t ON t.id = tm.team_id
        WHERE tm.user_id = auth.uid()
          AND t.org_id = invitations.org_id
      )
    )
  );
