import { createClient } from "@/lib/supabase/server";
import type { UserPreferences, UserSettings } from "@/types/settings";

const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: "America/New_York",
  notify_task_assigned_email: true,
  notify_mentions_email: true,
  notify_daily_digest_email: false,
};

export async function getUserSettings(userId: string, _orgId: string): Promise<UserSettings> {
  const supabase = await createClient();

  const [profileRes, prefsRes, teamMembersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_preferences")
      .select("timezone, notify_task_assigned_email, notify_mentions_email, notify_daily_digest_email")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("teams(id, name)")
      .eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const fullName = profile?.full_name ?? "";
  const spaceIdx = fullName.indexOf(" ");
  const firstName = spaceIdx > -1 ? fullName.slice(0, spaceIdx) : fullName;
  const lastName = spaceIdx > -1 ? fullName.slice(spaceIdx + 1) : "";

  const rawPrefs = prefsRes.data;
  const preferences: UserPreferences = rawPrefs
    ? {
        timezone: rawPrefs.timezone,
        notify_task_assigned_email: rawPrefs.notify_task_assigned_email,
        notify_mentions_email: rawPrefs.notify_mentions_email,
        notify_daily_digest_email: rawPrefs.notify_daily_digest_email,
      }
    : { ...DEFAULT_PREFERENCES };

  // Resolve team list from the nested join
  const teams: Array<{ id: string; name: string }> = [];
  for (const row of teamMembersRes.data ?? []) {
    const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    if (t && t.id && t.name) teams.push({ id: t.id, name: t.name });
  }

  return {
    firstName,
    lastName,
    email: profile?.email ?? "",
    teams,
    preferences,
  };
}
