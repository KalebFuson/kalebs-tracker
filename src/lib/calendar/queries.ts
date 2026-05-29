import { createClient } from "@/lib/supabase/server";
import type { CalendarTask, DateRange, OrgTag } from "@/types/calendar";
import type { OrgMember, TaskPriority, TaskStatus } from "@/types/tasks";

type RawSubtask = {
  id: string;
  is_completed: boolean;
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

export async function getTasksForCalendar(
  orgId: string,
  dateRange: DateRange,
): Promise<CalendarTask[]> {
  const supabase = await createClient();

  const { data: rawTasks, error } = await supabase
    .from("tasks")
    .select(
      `id, task_number, title, description, status, priority, due_date, created_at, team_id, assignee_id,
       teams(id, name),
       subtasks(id, is_completed),
       task_tags(tags(id, name))`,
    )
    .eq("org_id", orgId)
    .gte("due_date", dateRange.from)
    .lte("due_date", dateRange.to)
    .order("due_date", { ascending: true });

  if (error || !rawTasks) {
    console.error("[getTasksForCalendar]", error);
    return [];
  }

  const assigneeIds = [
    ...new Set(
      (rawTasks as RawTaskRow[])
        .map((t) => t.assignee_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const profileMap: Record<
    string,
    { full_name: string | null; email: string; avatar_url: string | null }
  > = {};

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

  return (rawTasks as RawTaskRow[]).map((raw) => {
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
}

export async function getOrgTags(orgId: string): Promise<OrgTag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id, name")
    .eq("org_id", orgId)
    .order("name");
  return data ?? [];
}

export async function getOrgMembersForCalendar(orgId: string): Promise<OrgMember[]> {
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

/** Returns user IDs of all members in any of the current user's teams. */
export async function getMyTeamMemberIds(orgId: string, userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data: myTeamRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  const teamIds = (myTeamRows ?? []).map((r) => r.team_id);
  if (teamIds.length === 0) return [userId];

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("user_id")
    .in("team_id", teamIds);

  return [...new Set((memberRows ?? []).map((r) => r.user_id))];
}
