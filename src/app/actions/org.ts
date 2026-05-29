"use server";

import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { slugifyName } from "@/lib/slugify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CreateOrgState } from "@/types/app";

const UNIQUE_VIOLATION = "23505";

export async function createOrganization(
  _prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  noStore();

  // Step 1: Identify the user via the normal server client (trusted)
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not signed in");
  }

  // Step 2: Validate form input
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput || slugifyName(name);

  if (!name) {
    return { error: "Organization name is required." };
  }

  if (!slug) {
    return { error: "Organization slug is required." };
  }

  // Step 3: Use admin client to bootstrap the org (bypasses RLS)
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug })
    .select("id, name, slug")
    .single();

  if (orgError) {
    if (orgError.code === UNIQUE_VIOLATION) {
      return { error: "That slug is already taken" };
    }
    throw new Error(orgError.message);
  }

  // Step 4: Make the authenticated user the first admin of this org
  const { error: memberError } = await admin.from("org_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  redirect("/dashboard");
}
