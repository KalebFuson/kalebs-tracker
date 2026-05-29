"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { CreateTeamInput, CreateTeamResult } from "@/types/teams";

type ActionResult = { ok: true } | { ok: false; error: string };

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
    .select("org_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id;
  if (!orgId) return { ok: false, error: "You must belong to an organization to create a team." };

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
    role: null,
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
    role: null,
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

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/teams");
  revalidatePath("/dashboard");

  return { ok: true };
}
