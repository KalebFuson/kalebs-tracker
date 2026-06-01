import { redirect } from "next/navigation";

import { TeamsGrid } from "@/components/teams/TeamsGrid";
import { createClient } from "@/lib/supabase/server";
import { getJoinContextForUser, getTeamsForOrg } from "@/lib/teams/queries";

export const metadata = { title: "Teams" };

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id;
  if (!orgId) redirect("/login");

  const isAdmin = membership.role === "admin";

  const [teams, joinContext] = await Promise.all([
    getTeamsForOrg(orgId),
    getJoinContextForUser(orgId, user.id),
  ]);

  return (
    <div className="p-6">
      <TeamsGrid
        teams={teams}
        isAdmin={isAdmin}
        memberTeamIds={joinContext.memberTeamIds}
        pendingTeamIds={joinContext.pendingTeamIds}
      />
    </div>
  );
}
