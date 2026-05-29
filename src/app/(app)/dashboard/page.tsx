import { redirect } from "next/navigation";

import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardStatCards } from "@/components/dashboard/DashboardStatCards";
import { MyTeamsPanel } from "@/components/dashboard/MyTeamsPanel";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { UpcomingTasksList } from "@/components/dashboard/UpcomingTasksList";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard/queries";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  // Derive display name: first word of full_name, or local-part of email
  const rawName = profileData?.full_name ?? profileData?.email ?? user.email ?? "";
  const displayName = rawName.includes("@")
    ? rawName.split("@")[0]
    : rawName.split(" ")[0];

  const data = await getDashboardData(user.id);

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Row 1 — Hero */}
      <DashboardHero displayName={displayName} stats={data.stats} />

      {/* Row 2 — Stat cards */}
      <DashboardStatCards stats={data.stats} />

      {/* Row 3+ — Two columns: left (Upcoming Tasks + Activity) | right (Calendar + Teams) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column — wider, takes 2/3 */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <UpcomingTasksList tasks={data.upcomingTasks} orgSlug={data.orgSlug} />
          <RecentActivityFeed events={data.recentEvents} />
        </div>

        {/* Right column — Calendar → My Teams */}
        <div className="flex flex-col gap-5">
          <DashboardCalendar datesWithTasks={data.datesWithTasks} />
          <MyTeamsPanel teams={data.teams} />
        </div>
      </div>
    </div>
  );
}
