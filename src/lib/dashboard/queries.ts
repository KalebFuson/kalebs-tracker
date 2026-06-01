import { createClient } from "@/lib/supabase/server";
import type {
  DashboardEvent,
  DashboardStats,
  DashboardTask,
  DashboardTeam,
} from "@/types/dashboard";

// Returns the org_id for the current user (first membership, same pattern as createTask).
async function getUserOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.org_id ?? null;
}

type RawTask = {
  id: string;
  task_number: number;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  teams: { name: string } | { name: string }[] | null;
};

function mapRawTasksToDashboard(rows: RawTask[]): DashboardTask[] {
  return rows.map((t) => {
    const teamRel = t.teams;
    const team = Array.isArray(teamRel) ? teamRel[0] : teamRel;
    return {
      id: t.id,
      task_number: t.task_number,
      title: t.title,
      status: t.status as DashboardTask["status"],
      priority: t.priority as DashboardTask["priority"],
      due_date: t.due_date,
      team_name: team?.name ?? null,
    };
  });
}

export type DashboardData = {
  stats: DashboardStats;
  upcomingTasks: DashboardTask[];
  windowTasks: DashboardTask[];
  datesWithTasks: string[];
  teams: DashboardTeam[];
  recentEvents: DashboardEvent[];
  orgSlug: string;
};

export async function getDashboardData(
  userId: string,
): Promise<DashboardData> {
  const supabase = await createClient();
  const orgId = await getUserOrgId(supabase, userId);

  if (!orgId) {
    return {
      stats: { openTasks: 0, overdueTasks: 0, upcomingThisWeek: 0 },
      upcomingTasks: [],
      windowTasks: [],
      datesWithTasks: [],
      teams: [],
      recentEvents: [],
      orgSlug: "",
    };
  }

  const today = new Date();
  // Use local date at midnight to avoid timezone drift in date comparisons.
  const todayStr = today.toISOString().slice(0, 10);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);
  const weekLaterStr = sevenDaysLater.toISOString().slice(0, 10);

  const [
    orgResult,
    openCountResult,
    overdueCountResult,
    upcomingCountResult,
    upcomingTasksResult,
    windowTasksResult,
    teamsResult,
    eventsResult,
  ] = await Promise.all([
    // Org slug for task key formatting
    supabase
      .from("organizations")
      .select("slug")
      .eq("id", orgId)
      .single(),

    // My Open Tasks count
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("assignee_id", userId)
      .neq("status", "done"),

    // Overdue Tasks count
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("assignee_id", userId)
      .neq("status", "done")
      .not("due_date", "is", null)
      .lt("due_date", todayStr),

    // Upcoming This Week count
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("assignee_id", userId)
      .neq("status", "done")
      .gte("due_date", todayStr)
      .lte("due_date", weekLaterStr),

    // Upcoming tasks list (for the list panel) — include team name for the tag
    supabase
      .from("tasks")
      .select("id, task_number, title, status, priority, due_date, teams(name)")
      .eq("org_id", orgId)
      .eq("assignee_id", userId)
      .neq("status", "done")
      .gte("due_date", todayStr)
      .lte("due_date", weekLaterStr)
      .order("due_date", { ascending: true })
      .limit(8),

    // Calendar dots + day-view filter: full rows from today onward (limit 200)
    supabase
      .from("tasks")
      .select("id, task_number, title, status, priority, due_date, teams(name)")
      .eq("org_id", orgId)
      .eq("assignee_id", userId)
      .neq("status", "done")
      .not("due_date", "is", null)
      .gte("due_date", todayStr)
      .order("due_date", { ascending: true })
      .limit(200),

    // My Teams with open task counts
    supabase
      .from("team_members")
      .select("teams(id, name, department)")
      .eq("user_id", userId),

    // Recent Activity
    supabase
      .from("events")
      .select("id, action, entity_type, entity_id, created_at, actor_id, profiles(full_name, email)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const orgSlug = orgResult.data?.slug ?? "";

  const stats: DashboardStats = {
    openTasks: openCountResult.count ?? 0,
    overdueTasks: overdueCountResult.count ?? 0,
    upcomingThisWeek: upcomingCountResult.count ?? 0,
  };

  // Sort upcoming tasks by priority after date sort (Supabase can only order by one column natively)
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const upcomingTasks: DashboardTask[] = mapRawTasksToDashboard(
    (upcomingTasksResult.data as RawTask[] ?? []).sort((a, b) => {
      if (a.due_date !== b.due_date) return 0;
      return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    }),
  );

  const windowTasks: DashboardTask[] = mapRawTasksToDashboard(
    windowTasksResult.data as RawTask[] ?? [],
  );

  const datesWithTasks = Array.from(
    new Set(
      windowTasks
        .map((t) => t.due_date)
        .filter((d): d is string => d !== null),
    ),
  );

  // Build team list with open task counts
  type TeamRow = { id: string; name: string; department: string | null };
  const rawTeams = (teamsResult.data ?? [])
    .map((tm) => {
      const t = tm.teams as TeamRow | TeamRow[] | null;
      return Array.isArray(t) ? t[0] : t;
    })
    .filter((t): t is TeamRow => t != null);

  const teams: DashboardTeam[] = await Promise.all(
    rawTeams.map(async (team) => {
      const [{ count: openTaskCount }, { count: memberCount }] = await Promise.all([
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("team_id", team.id)
          .neq("status", "done"),
        supabase
          .from("team_members")
          .select("id", { count: "exact", head: true })
          .eq("team_id", team.id),
      ]);
      return { ...team, openTaskCount: openTaskCount ?? 0, memberCount: memberCount ?? 0 };
    }),
  );

  type EventRow = {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
    actor_id: string | null;
    profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
  };
  const recentEvents: DashboardEvent[] = (eventsResult.data as EventRow[] ?? []).map((e) => {
    const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
    const actor_name = profile?.full_name ?? profile?.email ?? null;
    return {
      id: e.id,
      action: e.action,
      entity_type: e.entity_type,
      entity_id: e.entity_id,
      created_at: e.created_at,
      actor_name,
    };
  });

  return {
    stats,
    upcomingTasks,
    windowTasks,
    datesWithTasks,
    teams,
    recentEvents,
    orgSlug,
  };
}
