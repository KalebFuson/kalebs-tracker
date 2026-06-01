"use server";

import { unstable_noStore as noStore } from "next/cache";

import { getOrgMembers } from "@/lib/tasks/queries";
import { getOrgTeamsList } from "@/lib/teams/queries";
import { createClient } from "@/lib/supabase/server";

export type ExtractionOptions = {
  people: { id: string; label: string }[];
  teams: { id: string; name: string }[];
};

export async function getExtractionOptions(): Promise<
  { ok: true; options: ExtractionOptions } | { ok: false; error: string }
> {
  try {
    noStore();

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Not signed in." };
    }

    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error("[getExtractionOptions] org lookup failed:", membershipError);
      return { ok: false, error: membershipError.message };
    }

    const orgId = membership?.org_id ?? null;
    if (!orgId) {
      return { ok: false, error: "No organization found." };
    }

    const [members, teams] = await Promise.all([
      getOrgMembers(orgId),
      getOrgTeamsList(orgId),
    ]);

    const people = members.map((m) => ({
      id: m.id,
      label: m.full_name?.trim() || m.email,
    }));

    const teamsOptions = teams.map((t) => ({
      id: t.id,
      name: t.name,
    }));

    return {
      ok: true,
      options: { people, teams: teamsOptions },
    };
  } catch (err) {
    console.error("[getExtractionOptions] unexpected error:", err);
    return {
      ok: false,
      error: "Failed to load options. Please try again.",
    };
  }
}
