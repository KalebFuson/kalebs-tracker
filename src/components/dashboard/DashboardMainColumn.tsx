"use client";

import { useState } from "react";

import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import { MyTeamsPanel } from "@/components/dashboard/MyTeamsPanel";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { UpcomingTasksList } from "@/components/dashboard/UpcomingTasksList";
import type { DashboardEvent, DashboardTask, DashboardTeam } from "@/types/dashboard";

type DashboardMainColumnProps = {
  upcomingTasks: DashboardTask[];
  windowTasks: DashboardTask[];
  datesWithTasks: string[];
  orgSlug: string;
  recentEvents: DashboardEvent[];
  teams: DashboardTeam[];
};

export function DashboardMainColumn({
  upcomingTasks,
  windowTasks,
  datesWithTasks,
  orgSlug,
  recentEvents,
  teams,
}: DashboardMainColumnProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const dayTasks = selectedDay
    ? windowTasks.filter((t) => t.due_date === selectedDay)
    : null;

  const listTasks = dayTasks ?? upcomingTasks;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <UpcomingTasksList
          tasks={listTasks}
          orgSlug={orgSlug}
          selectedDay={selectedDay}
          onClearDay={() => setSelectedDay(null)}
        />
        <RecentActivityFeed events={recentEvents} />
      </div>

      <div className="flex flex-col gap-5">
        <DashboardCalendar
          datesWithTasks={datesWithTasks}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
        <MyTeamsPanel teams={teams} />
      </div>
    </div>
  );
}
