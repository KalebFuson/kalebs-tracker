import { redirect } from "next/navigation";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardMainColumn } from "@/components/dashboard/DashboardMainColumn";
import { DashboardStatCards } from "@/components/dashboard/DashboardStatCards";
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

  const rawName = profileData?.full_name ?? profileData?.email ?? user.email ?? "";
  const displayName = rawName.includes("@")
    ? rawName.split("@")[0]
    : rawName.split(" ")[0];

  const data = await getDashboardData(user.id);

  return (
    <div className="flex flex-col gap-5 p-6">
      <DashboardHero displayName={displayName} stats={data.stats} />

      <DashboardStatCards stats={data.stats} />

      <DashboardMainColumn
        upcomingTasks={data.upcomingTasks}
        windowTasks={data.windowTasks}
        datesWithTasks={data.datesWithTasks}
        orgSlug={data.orgSlug}
        recentEvents={data.recentEvents}
        teams={data.teams}
      />
    </div>
  );
}
