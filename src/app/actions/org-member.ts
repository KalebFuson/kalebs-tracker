"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getActorAndOrgId(): Promise<
  { ok: true; userId: string; orgId: string; role: string } | { ok: false; error: string }
> {
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

  if (!membership?.org_id) {
    return { ok: false, error: "You must belong to an organization." };
  }

  return { ok: true, userId: user.id, orgId: membership.org_id, role: membership.role };
}

// ---------------------------------------------------------------------------
// updateMemberRole
// ---------------------------------------------------------------------------
export async function updateMemberRole(
  memberId: string,
  newRole: "member" | "admin",
): Promise<ActionResult> {
  noStore();

  const actor = await getActorAndOrgId();
  if (!actor.ok) return actor;
  if (actor.role !== "admin") return { ok: false, error: "Only admins can change roles." };

  const supabase = await createClient();

  // Look up the member being changed
  const { data: target } = await supabase
    .from("org_members")
    .select("user_id, org_id")
    .eq("id", memberId)
    .single();

  if (!target) return { ok: false, error: "Member not found." };
  if (target.user_id === actor.userId) {
    return { ok: false, error: "You cannot change your own role." };
  }
  if (target.org_id !== actor.orgId) {
    return { ok: false, error: "Member is not in your organization." };
  }

  // RLS on org_members_update requires is_org_admin — this will work for admins
  const { error } = await supabase
    .from("org_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) return { ok: false, error: error.message };

  // Best-effort event
  await supabase.from("events").insert({
    org_id: actor.orgId,
    actor_id: actor.userId,
    entity_type: "org_member",
    entity_id: target.user_id,
    action: "role_changed",
    metadata: { from: target, to: newRole, target_user_id: target.user_id },
  });

  revalidatePath("/people");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// removeMember
// ---------------------------------------------------------------------------
export async function removeMember(memberId: string): Promise<ActionResult> {
  noStore();

  const actor = await getActorAndOrgId();
  if (!actor.ok) return actor;
  if (actor.role !== "admin") return { ok: false, error: "Only admins can remove members." };

  const supabase = await createClient();

  // Identify the member to remove
  const { data: target } = await supabase
    .from("org_members")
    .select("user_id, org_id")
    .eq("id", memberId)
    .single();

  if (!target) return { ok: false, error: "Member not found." };
  if (target.user_id === actor.userId) {
    return { ok: false, error: "You cannot remove yourself from the organization." };
  }
  if (target.org_id !== actor.orgId) {
    return { ok: false, error: "Member is not in your organization." };
  }

  // Use admin client for all cleanup — verified permissions above
  const admin = createAdminClient();

  // 1. Clean up team memberships within this org
  const { data: orgTeams } = await admin
    .from("teams")
    .select("id")
    .eq("org_id", actor.orgId);

  const orgTeamIds = (orgTeams ?? []).map((t) => t.id);
  if (orgTeamIds.length > 0) {
    await admin
      .from("team_members")
      .delete()
      .eq("user_id", target.user_id)
      .in("team_id", orgTeamIds);
  }

  // 2. Clear task assignments within this org
  await admin
    .from("tasks")
    .update({ assignee_id: null })
    .eq("org_id", actor.orgId)
    .eq("assignee_id", target.user_id);

  // 3. Delete the org membership
  const { error } = await admin.from("org_members").delete().eq("id", memberId);

  if (error) return { ok: false, error: error.message };

  // Best-effort event
  await admin.from("events").insert({
    org_id: actor.orgId,
    actor_id: actor.userId,
    entity_type: "org_member",
    entity_id: target.user_id,
    action: "removed",
    metadata: { removed_user_id: target.user_id },
  });

  revalidatePath("/people");
  revalidatePath("/teams");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// revokeInvitation
// ---------------------------------------------------------------------------
export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  noStore();

  const actor = await getActorAndOrgId();
  if (!actor.ok) return actor;
  if (actor.role !== "admin") {
    return { ok: false, error: "Only admins can revoke invitations." };
  }

  const supabase = await createClient();

  // RLS (invitations_delete) already enforces is_org_admin
  const { error } = await supabase.from("invitations").delete().eq("id", invitationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/people");
  return { ok: true };
}
