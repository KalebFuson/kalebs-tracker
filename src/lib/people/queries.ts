import { createClient } from "@/lib/supabase/server";
import type { OrgMemberWithProfile, PendingInvitation } from "@/types/people";

export async function getOrgMembersForPeople(
  orgId: string,
): Promise<OrgMemberWithProfile[]> {
  const supabase = await createClient();

  // 1. Org members
  const { data: rawMembers, error } = await supabase
    .from("org_members")
    .select("id, user_id, role, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error || !rawMembers?.length) return [];

  const userIds = rawMembers.map((m) => m.user_id);

  // 2. Fetch all teams for this org (to scope team membership)
  const { data: orgTeams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("org_id", orgId);

  const orgTeamIds = (orgTeams ?? []).map((t) => t.id);
  const teamNameById: Record<string, string> = {};
  for (const t of orgTeams ?? []) teamNameById[t.id] = t.name;

  // 3. Parallel: profiles + team memberships
  const [profileRes, teamMemberRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds),
    orgTeamIds.length > 0
      ? supabase
          .from("team_members")
          .select("user_id, team_id")
          .in("user_id", userIds)
          .in("team_id", orgTeamIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap: Record<
    string,
    { full_name: string | null; email: string; avatar_url: string | null }
  > = {};
  for (const p of profileRes.data ?? []) profileMap[p.id] = p;

  // Build per-user team list
  const teamsByUser: Record<string, Array<{ team_id: string; team_name: string }>> = {};
  for (const tm of teamMemberRes.data ?? []) {
    if (!teamsByUser[tm.user_id]) teamsByUser[tm.user_id] = [];
    if (teamNameById[tm.team_id]) {
      teamsByUser[tm.user_id].push({
        team_id: tm.team_id,
        team_name: teamNameById[tm.team_id],
      });
    }
  }

  return rawMembers.map((m) => {
    const profile = profileMap[m.user_id];
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role as "member" | "admin",
      joined_at: m.created_at,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? "",
      avatar_url: profile?.avatar_url ?? null,
      teams: teamsByUser[m.user_id] ?? [],
    };
  });
}

export async function getPendingInvitations(
  orgId: string,
): Promise<PendingInvitation[]> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  // This query is scoped by RLS to org admins only — non-admins get 0 rows
  const { data: rawInvitations } = await supabase
    .from("invitations")
    .select("id, email, role, token, created_at, expires_at, invited_by")
    .eq("org_id", orgId)
    .is("accepted_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (!rawInvitations?.length) return [];

  const inviterIds = [...new Set(rawInvitations.map((i) => i.invited_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", inviterIds);

  const inviterNameById: Record<string, string | null> = {};
  for (const p of profiles ?? []) inviterNameById[p.id] = p.full_name;

  return rawInvitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role as "member" | "admin",
    token: inv.token,
    created_at: inv.created_at,
    expires_at: inv.expires_at,
    invited_by_name: inviterNameById[inv.invited_by] ?? null,
  }));
}
