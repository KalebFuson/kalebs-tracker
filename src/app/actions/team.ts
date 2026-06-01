"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { CreateTeamInput, CreateTeamResult } from "@/types/teams";

type ActionResult = { ok: true } | { ok: false; error: string };

const ADMIN_ONLY_TEAMS_ERROR = "Only organization admins can manage teams.";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requireOrgAdmin(
  supabase: SupabaseServerClient,
  userId: string,
  orgId: string,
): Promise<ActionResult | null> {
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (membership?.role !== "admin") {
    return { ok: false, error: ADMIN_ONLY_TEAMS_ERROR };
  }
  return null;
}

async function requireOrgAdminForTeam(
  supabase: SupabaseServerClient,
  userId: string,
  teamId: string,
): Promise<ActionResult | null> {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("org_id")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !team) {
    return { ok: false, error: "Team not found." };
  }

  return requireOrgAdmin(supabase, userId, team.org_id);
}

export async function createTeam(input: CreateTeamInput): Promise<CreateTeamResult> {
  noStore();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Team name is required." };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id;
  if (!orgId) return { ok: false, error: "You must belong to an organization to create a team." };

  if (membership.role !== "admin") {
    return { ok: false, error: ADMIN_ONLY_TEAMS_ERROR };
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      org_id: orgId,
      name,
      department: input.department ?? null,
      description: input.description ?? null,
    })
    .select("id")
    .single();

  if (teamError || !team) {
    return { ok: false, error: teamError?.message ?? "Failed to create team." };
  }

  // Auto-join the creator as a team member
  await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "admin",
  });

  // Write a team-created event (best effort)
  await supabase.from("events").insert({
    org_id: orgId,
    actor_id: user.id,
    entity_type: "team",
    entity_id: team.id,
    action: "created",
  });

  revalidatePath("/teams");
  revalidatePath("/dashboard");

  return { ok: true, teamId: team.id };
}

export async function addTeamMember(
  teamId: string,
  userId: string,
): Promise<ActionResult> {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: userId,
    role: "member",
  });

  if (error) {
    // Ignore duplicate — user is already a member
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: error.message };
  }

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function removeTeamMember(
  teamMemberId: string,
  teamId: string,
): Promise<ActionResult> {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", teamMemberId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function updateTeamMemberRole(
  teamMemberId: string,
  newRole: "admin" | "member",
): Promise<ActionResult> {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const { data: target, error: targetError } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, role")
    .eq("id", teamMemberId)
    .maybeSingle();

  if (targetError || !target) {
    return { ok: false, error: "Team member not found." };
  }

  if (target.user_id === user.id) {
    return { ok: false, error: "You cannot change your own team role." };
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("org_id")
    .eq("id", target.team_id)
    .maybeSingle();

  if (teamError || !team) {
    return { ok: false, error: "Team not found." };
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", team.org_id)
    .maybeSingle();

  if (membership?.role !== "admin") {
    return { ok: false, error: "Only organization admins can change team roles." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role: newRole })
    .eq("id", teamMemberId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teams/${target.team_id}`);
  revalidatePath("/teams");

  return { ok: true };
}

type UpdateTeamInput = {
  teamId: string;
  updates: {
    name: string;
    department: string | null;
    description: string | null;
  };
};

export async function updateTeam(input: UpdateTeamInput): Promise<ActionResult> {
  noStore();

  const name = input.updates.name.trim();
  if (!name) return { ok: false, error: "Team name is required." };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const adminGuard = await requireOrgAdminForTeam(supabase, user.id, input.teamId);
  if (adminGuard) return adminGuard;

  const { error } = await supabase
    .from("teams")
    .update({
      name,
      department: input.updates.department,
      description: input.updates.description,
    })
    .eq("id", input.teamId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/teams");
  revalidatePath(`/teams/${input.teamId}`, "page");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function deleteTeam(teamId: string): Promise<ActionResult> {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const adminGuard = await requireOrgAdminForTeam(supabase, user.id, teamId);
  if (adminGuard) return adminGuard;

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/teams");
  revalidatePath("/dashboard");

  return { ok: true };
}
