import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { TeamActivityCard } from "@/components/teams/TeamActivityCard";
import { TeamHero } from "@/components/teams/TeamHero";
import { PendingJoinRequestsCard } from "@/components/teams/PendingJoinRequestsCard";
import { TeamMembersCard } from "@/components/teams/TeamMembersCard";
import { TeamStatsCard } from "@/components/teams/TeamStatsCard";
import { TeamTabs } from "@/components/teams/TeamTabs";
import { TeamTasksTab } from "@/components/teams/TeamTasksTab";
import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/tasks/queries";
import {
  getJoinContextForUser,
  getPendingJoinRequestsForTeam,
  getTeamById,
} from "@/lib/teams/queries";
import { getTasksForOrg } from "@/lib/tasks/queries";

type TeamDetailPageProps = {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function TeamDetailPage({ params, searchParams }: TeamDetailPageProps) {
  const { teamId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "tasks" ? "tasks" : "overview";

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

  const isOrgAdmin = membership.role === "admin";

  const [team, orgMembers, joinContext] = await Promise.all([
    getTeamById(teamId),
    getOrgMembers(orgId),
    getJoinContextForUser(orgId, user.id),
  ]);

  if (!team) notFound();

  const isTeamAdmin = team.members.some(
    (m) => m.user_id === user.id && m.role === "admin",
  );
  const canReviewJoinRequests = isOrgAdmin || isTeamAdmin;

  const pendingJoinRequests = canReviewJoinRequests
    ? await getPendingJoinRequestsForTeam(teamId)
    : [];

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Hero */}
      <TeamHero
        team={team}
        isAdmin={isOrgAdmin}
        memberTeamIds={joinContext.memberTeamIds}
        pendingTeamIds={joinContext.pendingTeamIds}
      />

      {/* Tabs bar */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-xs">
        <Suspense>
          <TeamTabs activeTab={activeTab} />
        </Suspense>

        <div className="p-6">
          {activeTab === "overview" ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Left: activity */}
              <div className="lg:col-span-2">
                <TeamActivityCard events={team.recent_events} />
              </div>

              {/* Right: members, stats */}
              <div className="flex flex-col gap-4">
                {canReviewJoinRequests && (
                  <PendingJoinRequestsCard requests={pendingJoinRequests} />
                )}
                <TeamMembersCard
                  teamId={team.id}
                  members={team.members}
                  orgMembers={orgMembers}
                  currentUserId={user.id}
                  isAdmin={isOrgAdmin}
                />
                <TeamStatsCard team={team} />
              </div>
            </div>
          ) : (
            <TeamTasksTabLoader orgId={orgId} userId={user.id} teamId={teamId} />
          )}
        </div>
      </div>
    </div>
  );
}

async function TeamTasksTabLoader({
  orgId,
  userId,
  teamId,
}: {
  orgId: string;
  userId: string;
  teamId: string;
}) {
  const { tasks } = await getTasksForOrg(orgId, userId, {
    filter: teamId,
    sort: "due_date_asc",
    page: 1,
    pageSize: 100,
  });

  return <TeamTasksTab tasks={tasks} teamId={teamId} />;
}
