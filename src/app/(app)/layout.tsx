import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/AppShell";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/types/app";

type OrgMemberRow = {
  org_id: string;
  organizations: Organization | Organization[] | null;
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile | null = profileData;

  const { data: membershipData } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const membership = membershipData as OrgMemberRow | null;
  const orgRelation = membership?.organizations;
  const organization: Organization | null = Array.isArray(orgRelation)
    ? (orgRelation[0] ?? null)
    : (orgRelation ?? null);

  return (
    <AppShell
      user={{ id: user.id, email: user.email }}
      profile={profile}
      organization={organization}
    >
      {children}
    </AppShell>
  );
}
