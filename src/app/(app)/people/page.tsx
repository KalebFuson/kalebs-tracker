import { redirect } from "next/navigation";

import { PeopleTable } from "@/components/people/PeopleTable";
import { createClient } from "@/lib/supabase/server";
import { getOrgMembersForPeople, getPendingInvitations } from "@/lib/people/queries";
import { getOrgTeamsList } from "@/lib/teams/queries";

export const metadata = { title: "People" };

export default async function PeoplePage() {
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

  const isAdmin = membership?.role === "admin";

  const [members, pendingInvitations, orgTeams] = await Promise.all([
    getOrgMembersForPeople(orgId),
    isAdmin ? getPendingInvitations(orgId) : Promise.resolve([]),
    getOrgTeamsList(orgId),
  ]);

  return (
    <div className="p-6">
      <PeopleTable
        members={members}
        pendingInvitations={pendingInvitations}
        orgTeams={orgTeams}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
