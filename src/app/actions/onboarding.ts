"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ has_completed_onboarding: true })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
