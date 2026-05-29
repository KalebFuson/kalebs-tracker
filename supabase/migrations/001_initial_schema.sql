-- =============================================================================
-- Kalebs Tracker — v1 initial database schema
-- =============================================================================
-- Created: 2026-05-29
--
-- HOW TO APPLY
--   Paste this entire file into the Supabase Dashboard → SQL Editor and run it.
--   Do NOT run via Supabase CLI in this project phase — apply manually only.
--
-- WHAT THIS FILE CONTAINS
--   • Core multi-tenant tables (organizations → tasks, tags, comments, events)
--   • Helper functions for RLS and per-org task numbering
--   • Triggers (profile on signup, task_number, updated_at)
--   • Row Level Security policies for org-scoped access
--   • Indexes for common query patterns
--
-- IDEMPOTENCY
--   Safe to re-run in development: uses IF NOT EXISTS, CREATE OR REPLACE, and
--   DROP POLICY IF EXISTS before recreating policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLES (dependency order)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- organizations
-- Top-level tenant. Every other business entity hangs off an org_id.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- profiles
-- One row per auth.users row — display name, avatar, email cache.
-- Populated automatically by trigger on auth.users INSERT.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name  text,
  avatar_url text,
  email      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- org_members
-- Links users to organizations with a role (member | admin).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('member', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- -----------------------------------------------------------------------------
-- teams
-- Groups within an org (e.g. Engineering, Design). Optional department label.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name        text        NOT NULL,
  department  text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- team_members
-- Users assigned to teams. role is an optional job title within the team.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid        NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- -----------------------------------------------------------------------------
-- tasks
-- Core work item. task_number is per-org sequential (KAL-1, KAL-2, …).
-- team_id is optional — tasks may exist without a team.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  team_id      uuid        REFERENCES public.teams (id) ON DELETE SET NULL,
  task_number  integer     NOT NULL,
  title        text        NOT NULL,
  description  text,
  status       text        NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'blocked')),
  priority     text        NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id  uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
  created_by   uuid        NOT NULL REFERENCES auth.users (id),
  due_date     date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, task_number)
);

-- -----------------------------------------------------------------------------
-- subtasks
-- Checklist items on a task. position controls display order.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subtasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid        NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  title        text        NOT NULL,
  is_completed boolean     NOT NULL DEFAULT false,
  position     integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- tags
-- Org-scoped labels. Names are unique per org.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

-- -----------------------------------------------------------------------------
-- task_tags
-- Many-to-many join between tasks and tags.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_tags (
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- comments
-- Threaded discussion on a task (flat list for v1).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid        NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- events
-- Append-only audit log. v1 is write-only (no SELECT policy yet).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  actor_id    uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
  entity_type text        NOT NULL,
  entity_id   uuid        NOT NULL,
  action      text        NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- invitations
-- Email invites to join an org. token is unique; expires_at enforced in app.
-- default_team_ids: teams to add the user to on accept.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email            text        NOT NULL,
  role             text        NOT NULL CHECK (role IN ('member', 'admin')),
  token            text        NOT NULL UNIQUE,
  invited_by       uuid        NOT NULL REFERENCES auth.users (id),
  default_team_ids uuid[],
  expires_at       timestamptz NOT NULL,
  accepted_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_org_status
  ON public.tasks (org_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_org_assignee
  ON public.tasks (org_id, assignee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_org_due_date
  ON public.tasks (org_id, due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_team_id
  ON public.tasks (team_id);

CREATE INDEX IF NOT EXISTS idx_comments_task_created
  ON public.comments (task_id, created_at);

CREATE INDEX IF NOT EXISTS idx_events_org_created
  ON public.events (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON public.org_members (user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- get_user_org_ids()
-- Returns all org_ids the current user belongs to.
-- SECURITY DEFINER avoids infinite recursion: org_members RLS policies must
-- NOT query org_members directly; they use this function instead.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM public.org_members
  WHERE user_id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- is_org_admin(org_id)
-- Convenience check used in admin-only RLS policies.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- next_task_number(org_id)
-- Returns max(task_number) + 1 for the org, or 1 if no tasks exist yet.
-- Called by BEFORE INSERT trigger on tasks (not safe under heavy concurrency
-- without advisory locks — acceptable for v1).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_task_number(p_org_id uuid)
RETURNS integer
LANGUAGE sql
VOLATILE
AS $$
  SELECT COALESCE(MAX(task_number), 0) + 1
  FROM public.tasks
  WHERE org_id = p_org_id;
$$;

-- -----------------------------------------------------------------------------
-- set_task_number()
-- BEFORE INSERT on tasks: auto-assign task_number when omitted.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_task_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.task_number IS NULL THEN
    NEW.task_number := public.next_task_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- set_updated_at()
-- BEFORE UPDATE on tasks: keep updated_at in sync.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- handle_new_user()
-- AFTER INSERT on auth.users: create matching public.profiles row.
-- SECURITY DEFINER so the insert bypasses profiles RLS.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS tasks_set_task_number ON public.tasks;
CREATE TRIGGER tasks_set_task_number
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_number();

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations    ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- organizations
-- Not org_id-scoped (this IS the org). Members see their orgs; anyone signed
-- in can create one; only admins can update or delete.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS organizations_select ON public.organizations;
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT
  USING (id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS organizations_insert ON public.organizations;
CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS organizations_update ON public.organizations;
CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE
  USING (public.is_org_admin(id))
  WITH CHECK (public.is_org_admin(id));

DROP POLICY IF EXISTS organizations_delete ON public.organizations;
CREATE POLICY organizations_delete ON public.organizations
  FOR DELETE
  USING (public.is_org_admin(id));

-- -----------------------------------------------------------------------------
-- profiles
-- SELECT: any profile belonging to a user who shares an org with you.
-- UPDATE: only your own row. INSERT handled by auth trigger (SECURITY DEFINER).
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (
    -- Always see your own profile (e.g. before joining any org)
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.org_members AS mine
      INNER JOIN public.org_members AS theirs
        ON mine.org_id = theirs.org_id
      WHERE mine.user_id = auth.uid()
        AND theirs.user_id = profiles.id
    )
  );

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------------
-- org_members
-- SELECT: any member of an org you belong to.
-- INSERT/UPDATE/DELETE: admins only, EXCEPT bootstrap (first admin for new org).
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS org_members_select ON public.org_members;
CREATE POLICY org_members_select ON public.org_members
  FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS org_members_insert ON public.org_members;
CREATE POLICY org_members_insert ON public.org_members
  FOR INSERT
  WITH CHECK (
    -- Existing org admin adding someone
    public.is_org_admin(org_id)
    OR (
      -- Bootstrap: first member of a new org adds themselves as admin
      user_id = auth.uid()
      AND role = 'admin'
      AND NOT EXISTS (
        SELECT 1 FROM public.org_members AS om
        WHERE om.org_id = org_id
      )
    )
  );

DROP POLICY IF EXISTS org_members_update ON public.org_members;
CREATE POLICY org_members_update ON public.org_members
  FOR UPDATE
  USING (public.is_org_admin(org_id))
  WITH CHECK (public.is_org_admin(org_id));

DROP POLICY IF EXISTS org_members_delete ON public.org_members;
CREATE POLICY org_members_delete ON public.org_members
  FOR DELETE
  USING (public.is_org_admin(org_id));

-- -----------------------------------------------------------------------------
-- teams — standard org-scoped CRUD for members
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS teams_select ON public.teams;
CREATE POLICY teams_select ON public.teams
  FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS teams_insert ON public.teams;
CREATE POLICY teams_insert ON public.teams
  FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS teams_update ON public.teams;
CREATE POLICY teams_update ON public.teams
  FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()))
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS teams_delete ON public.teams;
CREATE POLICY teams_delete ON public.teams
  FOR DELETE
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- -----------------------------------------------------------------------------
-- team_members
-- SELECT: visible if the parent team's org is one of yours.
-- INSERT/UPDATE/DELETE: org admins OR user adding/removing themselves only.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS team_members_select ON public.team_members;
CREATE POLICY team_members_select ON public.team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS team_members_insert ON public.team_members;
CREATE POLICY team_members_insert ON public.team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
    AND (
      public.is_org_admin(
        (SELECT t.org_id FROM public.teams AS t WHERE t.id = team_members.team_id)
      )
      OR user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS team_members_update ON public.team_members;
CREATE POLICY team_members_update ON public.team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
    AND (
      public.is_org_admin(
        (SELECT t.org_id FROM public.teams AS t WHERE t.id = team_members.team_id)
      )
      OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
    AND (
      public.is_org_admin(
        (SELECT t.org_id FROM public.teams AS t WHERE t.id = team_members.team_id)
      )
      OR user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS team_members_delete ON public.team_members;
CREATE POLICY team_members_delete ON public.team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
    AND (
      public.is_org_admin(
        (SELECT t.org_id FROM public.teams AS t WHERE t.id = team_members.team_id)
      )
      OR user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- tasks — standard org-scoped CRUD for members
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks
  FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS tasks_insert ON public.tasks;
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS tasks_update ON public.tasks;
CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()))
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- -----------------------------------------------------------------------------
-- subtasks — access via parent task's org (no direct org_id column)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS subtasks_select ON public.subtasks;
CREATE POLICY subtasks_select ON public.subtasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = subtasks.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS subtasks_insert ON public.subtasks;
CREATE POLICY subtasks_insert ON public.subtasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = subtasks.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS subtasks_update ON public.subtasks;
CREATE POLICY subtasks_update ON public.subtasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = subtasks.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = subtasks.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS subtasks_delete ON public.subtasks;
CREATE POLICY subtasks_delete ON public.subtasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = subtasks.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------------------
-- tags — standard org-scoped CRUD
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS tags_select ON public.tags;
CREATE POLICY tags_select ON public.tags
  FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS tags_insert ON public.tags;
CREATE POLICY tags_insert ON public.tags
  FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS tags_update ON public.tags;
CREATE POLICY tags_update ON public.tags
  FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()))
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS tags_delete ON public.tags;
CREATE POLICY tags_delete ON public.tags
  FOR DELETE
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- -----------------------------------------------------------------------------
-- task_tags — access when parent task is in your org; tag must match same org
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS task_tags_select ON public.task_tags;
CREATE POLICY task_tags_select ON public.task_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = task_tags.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS task_tags_insert ON public.task_tags;
CREATE POLICY task_tags_insert ON public.task_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      INNER JOIN public.tags AS g ON g.id = task_tags.tag_id
      WHERE t.id = task_tags.task_id
        AND t.org_id = g.org_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS task_tags_update ON public.task_tags;
CREATE POLICY task_tags_update ON public.task_tags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = task_tags.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      INNER JOIN public.tags AS g ON g.id = task_tags.tag_id
      WHERE t.id = task_tags.task_id
        AND t.org_id = g.org_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS task_tags_delete ON public.task_tags;
CREATE POLICY task_tags_delete ON public.task_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = task_tags.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------------------
-- comments — access via parent task's org
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS comments_select ON public.comments;
CREATE POLICY comments_select ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = comments.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS comments_insert ON public.comments;
CREATE POLICY comments_insert ON public.comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = comments.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS comments_update ON public.comments;
CREATE POLICY comments_update ON public.comments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = comments.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = comments.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS comments_delete ON public.comments;
CREATE POLICY comments_delete ON public.comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.tasks AS t
      WHERE t.id = comments.task_id
        AND t.org_id IN (SELECT public.get_user_org_ids())
    )
  );

-- -----------------------------------------------------------------------------
-- events — write-only for v1: INSERT only, no SELECT policy
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS events_insert ON public.events;
CREATE POLICY events_insert ON public.events
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT public.get_user_org_ids())
    AND (actor_id IS NULL OR actor_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- invitations — admins only (no UPDATE policy in v1 spec)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations
  FOR SELECT
  USING (public.is_org_admin(org_id));

DROP POLICY IF EXISTS invitations_insert ON public.invitations;
CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT
  WITH CHECK (
    public.is_org_admin(org_id)
    AND invited_by = auth.uid()
  );

DROP POLICY IF EXISTS invitations_delete ON public.invitations;
CREATE POLICY invitations_delete ON public.invitations
  FOR DELETE
  USING (public.is_org_admin(org_id));

-- =============================================================================
-- GRANTS (Supabase API roles)
-- =============================================================================
-- RLS enforces row access; grants allow the roles to attempt operations.

GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_task_number(uuid) TO authenticated;
