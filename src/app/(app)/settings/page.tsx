import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/SettingsForm";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/settings/queries";

export const metadata = { title: "Profile & Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id ?? "";

  const settings = await getUserSettings(user.id, orgId);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Profile &amp; Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your personal information, team associations, and application preferences.
          </p>
        </div>

        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
