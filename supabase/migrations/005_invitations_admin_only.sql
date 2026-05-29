-- =============================================================================
-- Migration 005 — Restore invitations INSERT to admins only
-- =============================================================================
-- Migration 003 broadened the policy so any team member could invite.
-- We are locking this back to org admins only. Team-level membership
-- is handled separately via the "Add Member" flow (existing org members only).
--
-- HOW TO APPLY
--   Paste into Supabase Dashboard → SQL Editor and run.
-- =============================================================================

DROP POLICY IF EXISTS invitations_insert ON public.invitations;

CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT
  WITH CHECK (
    public.is_org_admin(org_id)
    AND invited_by = auth.uid()
  );
