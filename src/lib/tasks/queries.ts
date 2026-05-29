import { createClient } from "@/lib/supabase/server";
import type {
  ActivityMetadata,
  OrgMember,
  TaskActivity,
  TaskDetail,
  TaskListItem,
  TaskPriority,
  TaskStatus,
  TaskSubtask,
  TasksQueryOpts,
  TasksQueryResult,
  TeamFilterOption,
} from "@/types/tasks";

// NOTE: tasks.assignee_id → auth.users.id ← profiles.id
// There is no direct FK from tasks to profiles, so PostgREST cannot auto-join them.
// We do a separate .in("id", assigneeIds) profiles fetch and merge in JS.
// Same applies to events.actor_id.

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_ORDER: Record<string, number> = {
  todo: 1,
  in_progress: 2,
  in_review: 3,
  blocked: 4,
  done: 5,
};

type RawSubtask = {
  id: string;
  is_completed: boolean;
  title?: string;
  position?: number;
};

type RawTagJoin = {
  tags: { id: string; name: string } | { id: string; name: string }[] | null;
};

type RawTaskRow = {
  id: string;
  task_number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  team_id: string | null;
  assignee_id: string | null;
  teams: { id: string; name: string } | { id: string; name: string }[] | null;
  subtasks: RawSubtask[];
  task_tags: RawTagJoin[];
};

function resolveTeam(raw: RawTaskRow["teams"]): { id: string; name: string } | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function resolveTagNames(task_tags: RawTagJoin[]): string[] {
  return task_tags
    .map((tt) => {
      const tag = Array.isArray(tt.tags) ? tt.tags[0] : tt.tags;
      return tag?.name ?? "";
    })
    .filter(Boolean);
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId);

  const userIds = (data ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", userIds);

  return (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    avatar_url: p.avatar_url,
  }));
}

export async function getUserTeamsForOrg(
  orgId: string,
  userId: string,
): Promise<TeamFilterOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("teams(id, name)")
    .eq("user_id", userId);

  return (data ?? [])
    .map((row) => {
      const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
      return t as TeamFilterOption | null;
    })
    .filter((t): t is TeamFilterOption => t !== null);
}

export async function getTasksForOrg(
  orgId: string,
  userId: string,
  opts: TasksQueryOpts,
): Promise<TasksQueryResult> {
  const supabase = await createClient();
  const pageSize = opts.pageSize ?? 10;
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("tasks")
    .select(
      `id, task_number, title, description, status, priority, due_date, created_at, team_id, assignee_id,
       teams(id, name),
       subtasks(id, is_completed),
       task_tags(tags(id, name))`,
      { count: "exact" },
    )
    .eq("org_id", orgId);

  if (opts.filter === "my_tasks") {
    query = query.eq("assignee_id", userId);
  } else if (opts.filter && opts.filter !== "all") {
    // filter is a team_id UUID
    query = query.eq("team_id", opts.filter);
  }

  if (opts.search?.trim()) {
    query = query.ilike("title", `%${opts.search.trim()}%`);
  }

  // Apply DB-level sort for date/time columns; priority & status are sorted in JS below
  switch (opts.sort) {
    case "due_date_desc":
      query = query.order("due_date", { ascending: false, nullsFirst: false });
      break;
    case "created_at":
      query = query.order("created_at", { ascending: false });
      break;
    case "due_date_asc":
    default:
      query = query.order("due_date", { ascending: true, nullsFirst: false });
      break;
  }

  query = query.range(from, to);

  const { data: rawTasks, count, error } = await query;

  if (error) {
    console.error("[getTasksForOrg]", error);
    return { tasks: [], total: 0, page, pageSize };
  }

  // Fetch assignee profiles in a single round-trip
  const assigneeIds = [
    ...new Set(
      (rawTasks as RawTaskRow[]).map((t) => t.assignee_id).filter((id): id is string => id !== null),
    ),
  ];

  const profileMap: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> =
    {};

  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", assigneeIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = {
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
      };
    }
  }

  const tasks: TaskListItem[] = (rawTasks as RawTaskRow[]).map((raw) => {
    const team = resolveTeam(raw.teams);
    const profile = raw.assignee_id ? (profileMap[raw.assignee_id] ?? null) : null;
    const subtasks = raw.subtasks ?? [];

    return {
      id: raw.id,
      task_number: raw.task_number,
      title: raw.title,
      description: raw.description,
      status: raw.status as TaskStatus,
      priority: raw.priority as TaskPriority,
      due_date: raw.due_date,
      created_at: raw.created_at,
      team_id: raw.team_id,
      team_name: team?.name ?? null,
      assignee_id: raw.assignee_id,
      assignee_name: profile?.full_name ?? null,
      assignee_email: profile?.email ?? null,
      assignee_avatar: profile?.avatar_url ?? null,
      tag_names: resolveTagNames(raw.task_tags),
      subtask_count: subtasks.length,
      completed_subtask_count: subtasks.filter((s) => s.is_completed).length,
    };
  });

  // JS-level sort for priority and status (correct semantic order within the current page)
  if (opts.sort === "priority") {
    tasks.sort((a, b) => (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0));
  } else if (opts.sort === "status") {
    tasks.sort((a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0));
  }

  return { tasks, total: count ?? 0, page, pageSize };
}

export async function getTaskByNumber(
  orgId: string,
  taskNumber: number,
): Promise<TaskDetail | null> {
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("tasks")
    .select(
      `id, task_number, title, description, status, priority, due_date, created_at, team_id, assignee_id,
       teams(id, name),
       subtasks(id, title, is_completed, position),
       task_tags(tags(id, name))`,
    )
    .eq("org_id", orgId)
    .eq("task_number", taskNumber)
    .single();

  if (error || !raw) return null;

  const rawTyped = raw as RawTaskRow & {
    subtasks: Array<{ id: string; title: string; is_completed: boolean; position: number }>;
  };

  // Fetch assignee profile
  const profileMap: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> =
    {};
  if (rawTyped.assignee_id) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", rawTyped.assignee_id);
    for (const p of profileRows ?? []) {
      profileMap[p.id] = { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url };
    }
  }

  // Fetch events for this task (events_select policy added in migration 002)
  const { data: eventsData } = await supabase
    .from("events")
    .select("id, action, entity_type, created_at, actor_id, metadata")
    .eq("entity_type", "task")
    .eq("entity_id", rawTyped.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch actor profiles for events
  const actorIds = [
    ...new Set(
      (eventsData ?? []).map((e) => e.actor_id).filter((id): id is string => id !== null),
    ),
  ];
  const actorProfileMap: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> =
    {};
  if (actorIds.length > 0) {
    const { data: actorProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", actorIds);
    for (const p of actorProfiles ?? []) {
      actorProfileMap[p.id] = { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url };
    }
  }

  const team = resolveTeam(rawTyped.teams);
  const profile = rawTyped.assignee_id ? (profileMap[rawTyped.assignee_id] ?? null) : null;
  const subtasks = rawTyped.subtasks ?? [];

  const sortedSubtasks: TaskSubtask[] = [...subtasks]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((s) => ({
      id: s.id,
      title: s.title,
      is_completed: s.is_completed,
      position: s.position ?? 0,
    }));

  const activity: TaskActivity[] = (eventsData ?? []).map((e) => {
    const ap = e.actor_id ? (actorProfileMap[e.actor_id] ?? null) : null;
    return {
      id: e.id,
      action: e.action,
      entity_type: e.entity_type,
      created_at: e.created_at,
      actor_name: ap?.full_name ?? ap?.email ?? null,
      actor_avatar: ap?.avatar_url ?? null,
      metadata: (e.metadata as ActivityMetadata) ?? null,
    };
  });

  return {
    id: rawTyped.id,
    task_number: rawTyped.task_number,
    title: rawTyped.title,
    description: rawTyped.description,
    status: rawTyped.status as TaskStatus,
    priority: rawTyped.priority as TaskPriority,
    due_date: rawTyped.due_date,
    created_at: rawTyped.created_at,
    team_id: rawTyped.team_id,
    team_name: team?.name ?? null,
    assignee_id: rawTyped.assignee_id,
    assignee_name: profile?.full_name ?? null,
    assignee_email: profile?.email ?? null,
    assignee_avatar: profile?.avatar_url ?? null,
    tag_names: resolveTagNames(rawTyped.task_tags),
    subtask_count: subtasks.length,
    completed_subtask_count: subtasks.filter((s) => s.is_completed).length,
    subtasks: sortedSubtasks,
    activity,
  };
}
