"use server";

import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { SendInvitationsInput, SendInvitationsResult, SentInvitation } from "@/types/teams";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_RE.test(e));
}

export async function sendInvitations(
  input: SendInvitationsInput,
): Promise<SendInvitationsResult> {
  noStore();

  const emails = parseEmails(input.emails.join(","));
  if (emails.length === 0) {
    return { ok: false, error: "Please provide at least one valid email address." };
  }

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
  if (!orgId) return { ok: false, error: "You must belong to an organization to send invitations." };

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const results: SentInvitation[] = [];
  const errors: string[] = [];

  for (const email of emails) {
    const token = crypto.randomUUID();
    const { error } = await supabase.from("invitations").insert({
      org_id: orgId,
      email,
      role: input.role,
      token,
      invited_by: user.id,
      default_team_ids: input.defaultTeamIds.length > 0 ? input.defaultTeamIds : null,
      expires_at: expiresAt,
    });

    if (error) {
      errors.push(`${email}: ${error.message}`);
    } else {
      results.push({ email, token });
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return { ok: false, error: errors.join("; ") };
  }

  return { ok: true, invitations: results };
}

// ---------------------------------------------------------------------------
// Accept invitation
// ---------------------------------------------------------------------------

export type AcceptInvitationResult = { ok: true } | { ok: false; error: string };

export async function acceptInvitation(token: string): Promise<AcceptInvitationResult> {
  noStore();

  // 1. Verify caller is signed in
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };
  if (!user.email) return { ok: false, error: "Account has no email address." };

  // 2. Look up the invitation via SECURITY DEFINER RPC
  const { data: rows, error: rpcError } = await supabase.rpc(
    "get_invitation_by_token",
    { p_token: token },
  );

  if (rpcError) return { ok: false, error: rpcError.message };

  const invitation = rows?.[0] ?? null;
  if (!invitation) return { ok: false, error: "Invitation not found." };
  if (invitation.accepted_at) return { ok: false, error: "This invitation has already been accepted." };
  if (new Date(invitation.expires_at) < new Date()) {
    return { ok: false, error: "This invitation has expired." };
  }

  // 3. Email must match
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return {
      ok: false,
      error: `This invitation is for ${invitation.email}. Please sign in with that account.`,
    };
  }

  // 4. Use admin client for the bootstrap inserts (same pattern as createOrganization).
  //    We've verified the user's identity and the token — admin access is justified here.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // 4a. Join the org (upsert — user might already be a member of this org)
  const { error: orgMemberError } = await admin
    .from("org_members")
    .upsert(
      { org_id: invitation.org_id, user_id: user.id, role: invitation.role },
      { onConflict: "org_id,user_id", ignoreDuplicates: true },
    );

  if (orgMemberError) return { ok: false, error: orgMemberError.message };

  // 4b. Join the default teams (if any)
  const teamIds: string[] = invitation.default_team_ids ?? [];
  if (teamIds.length > 0) {
    const teamMemberRows = teamIds.map((teamId: string) => ({
      team_id: teamId,
      user_id: user.id,
      role: null,
    }));

    const { error: teamMemberError } = await admin
      .from("team_members")
      .upsert(teamMemberRows, { onConflict: "team_id,user_id", ignoreDuplicates: true });

    if (teamMemberError) return { ok: false, error: teamMemberError.message };
  }

  // 5. Mark invitation as accepted
  const { error: updateError } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  if (updateError) return { ok: false, error: updateError.message };

  // 6. Write an event (best-effort)
  await admin.from("events").insert({
    org_id: invitation.org_id,
    actor_id: user.id,
    entity_type: "org_member",
    entity_id: invitation.id,
    action: "joined",
    metadata: { via: "invitation" },
  });

  return { ok: true };
}
