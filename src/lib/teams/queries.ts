import { createClient } from "@/lib/supabase/server";
import type {
  JoinContextForUser,
  OrgTeam,
  PendingJoinRequest,
  TeamDetail,
  TeamEvent,
  TeamListItem,
  TeamMember,
  TeamMemberPreview,
} from "@/types/teams";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

async function fetchProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
): Promise<Record<string, ProfileRow>> {
  if (userIds.length === 0) return {};
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", userIds);
  const map: Record<string, ProfileRow> = {};
  for (const p of data ?? []) map[p.id] = p;
  return map;
}

export async function getTeamsForOrg(orgId: string): Promise<TeamListItem[]> {
  const supabase = await createClient();

  const { data: rawTeams, error } = await supabase
    .from("teams")
    .select("id, name, department, description, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error || !rawTeams?.length) return [];

  const teamIds = rawTeams.map((t) => t.id);

  // Parallel: members + active tasks
  const [memberRes, taskRes] = await Promise.all([
    supabase.from("team_members").select("team_id, user_id").in("team_id", teamIds),
    supabase
      .from("tasks")
      .select("team_id")
      .in("team_id", teamIds)
      .neq("status", "done"),
  ]);

  const allMembers = memberRes.data ?? [];
  const userIds = [...new Set(allMembers.map((m) => m.user_id))];
  const profileMap = await fetchProfiles(supabase, userIds);

  // Build per-team member lists
  const membersByTeam: Record<string, TeamMemberPreview[]> = {};
  for (const m of allMembers) {
    if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
    const p = profileMap[m.user_id];
    membersByTeam[m.team_id].push({
      user_id: m.user_id,
      full_name: p?.full_name ?? null,
      avatar_url: p?.avatar_url ?? null,
    });
  }

  // Build active task count per team
  const activeByTeam: Record<string, number> = {};
  for (const t of taskRes.data ?? []) {
    if (t.team_id) activeByTeam[t.team_id] = (activeByTeam[t.team_id] ?? 0) + 1;
  }

  return rawTeams.map((team) => ({
    id: team.id,
    name: team.name,
    department: team.department,
    description: team.description,
    created_at: team.created_at,
    member_count: (membersByTeam[team.id] ?? []).length,
    active_task_count: activeByTeam[team.id] ?? 0,
    members: membersByTeam[team.id] ?? [],
  }));
}

export async function getTeamById(teamId: string): Promise<TeamDetail | null> {
  const supabase = await createClient();

  // Fetch team basics
  const { data: team, error } = await supabase
    .from("teams")
    .select("id, name, department, description, created_at")
    .eq("id", teamId)
    .single();

  if (error || !team) return null;

  // Fetch members + tasks in parallel
  const [memberRes, taskRes] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, user_id, role, created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, status, due_date")
      .eq("team_id", teamId),
  ]);

  const rawMembers = memberRes.data ?? [];
  const memberUserIds = rawMembers.map((m) => m.user_id);
  const profileMap = await fetchProfiles(supabase, memberUserIds);

  const members: TeamMember[] = rawMembers.map((m) => {
    const p = profileMap[m.user_id];
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role ?? null,
      full_name: p?.full_name ?? null,
      email: p?.email ?? "",
      avatar_url: p?.avatar_url ?? null,
      joined_at: m.created_at,
    };
  });

  // Task stats
  const today = new Date().toISOString().slice(0, 10);
  const tasks = taskRes.data ?? [];
  const active_task_count = tasks.filter((t) => t.status !== "done").length;
  const overdue_task_count = tasks.filter(
    (t) => t.status !== "done" && t.due_date != null && t.due_date < today,
  ).length;
  const completed_task_count = tasks.filter((t) => t.status === "done").length;

  // Recent events — for tasks in this team + team-level events
  const taskIds = tasks.map((t) => t.id);
  const entityIds = [...taskIds, teamId];

  let recent_events: TeamEvent[] = [];
  if (entityIds.length > 0) {
    const { data: rawEvents } = await supabase
      .from("events")
      .select("id, action, entity_type, entity_id, created_at, actor_id, metadata")
      .in("entity_id", entityIds)
      .order("created_at", { ascending: false })
      .limit(15);

    if (rawEvents && rawEvents.length > 0) {
      const actorIds = [
        ...new Set(
          rawEvents.map((e) => e.actor_id).filter((id): id is string => id != null),
        ),
      ];
      const actorMap = await fetchProfiles(supabase, actorIds);

      recent_events = rawEvents.map((e) => ({
        id: e.id,
        action: e.action,
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        created_at: e.created_at,
        actor_name: e.actor_id ? (actorMap[e.actor_id]?.full_name ?? null) : null,
        actor_avatar: e.actor_id ? (actorMap[e.actor_id]?.avatar_url ?? null) : null,
        metadata: (e.metadata as Record<string, unknown>) ?? null,
      }));
    }
  }

  return {
    id: team.id,
    name: team.name,
    department: team.department,
    description: team.description,
    created_at: team.created_at,
    members,
    active_task_count,
    overdue_task_count,
    completed_task_count,
    recent_events,
  };
}

/** Simple list for dropdowns / invite checkboxes */
export async function getOrgTeamsList(orgId: string): Promise<OrgTeam[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("id, name")
    .eq("org_id", orgId)
    .order("name");
  return data ?? [];
}

export async function getJoinContextForUser(
  orgId: string,
  userId: string,
): Promise<JoinContextForUser> {
  const supabase = await createClient();

  const [memberRes, pendingRes, teamsRes] = await Promise.all([
    supabase.from("team_members").select("team_id").eq("user_id", userId),
    supabase
      .from("team_join_requests")
      .select("team_id")
      .eq("user_id", userId)
      .eq("status", "pending"),
    supabase.from("teams").select("id").eq("org_id", orgId),
  ]);

  const orgTeamIds = new Set((teamsRes.data ?? []).map((t) => t.id));

  const memberTeamIds = (memberRes.data ?? [])
    .map((m) => m.team_id)
    .filter((id) => orgTeamIds.has(id));

  const pendingTeamIds = (pendingRes.data ?? [])
    .map((r) => r.team_id)
    .filter((id) => orgTeamIds.has(id));

  return { memberTeamIds, pendingTeamIds };
}

export async function getPendingJoinRequestsForTeam(
  teamId: string,
): Promise<PendingJoinRequest[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("team_join_requests")
    .select("id, user_id, team_id, created_at")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !rows?.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profileMap = await fetchProfiles(supabase, userIds);

  return rows.map((r) => {
    const p = profileMap[r.user_id];
    return {
      id: r.id,
      user_id: r.user_id,
      team_id: r.team_id,
      created_at: r.created_at,
      full_name: p?.full_name ?? null,
      email: p?.email ?? "",
    };
  });
}

/** Return the org_id for a given team (for permission checks in actions) */
export async function getTeamOrgId(teamId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("org_id")
    .eq("id", teamId)
    .single();
  return data?.org_id ?? null;
}
