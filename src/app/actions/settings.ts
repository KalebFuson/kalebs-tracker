"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { UpdateSettingsInput, UpdateSettingsResult } from "@/types/settings";

export async function updateSettings(
  input: UpdateSettingsInput,
): Promise<UpdateSettingsResult> {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const fullName = input.fullName.trim();

  // Update display name in profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", user.id);

  if (profileError) return { ok: false, error: profileError.message };

  // Upsert preferences
  const { error: prefsError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        timezone: input.timezone,
        notify_task_assigned_email: input.notifyTaskAssignedEmail,
        notify_mentions_email: input.notifyMentionsEmail,
        notify_daily_digest_email: input.notifyDailyDigestEmail,
      },
      { onConflict: "user_id" },
    );

  if (prefsError) return { ok: false, error: prefsError.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { ok: true };
}
