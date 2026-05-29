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
