"use client";

import { CreateTaskMenu } from "@/components/tasks/CreateTaskMenu";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";

type DashboardHeroProps = {
  displayName: string;
  stats: DashboardStats;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function buildSubtitle(stats: DashboardStats): string {
  const parts: string[] = [];
  if (stats.overdueTasks > 0) {
    parts.push(
      `${stats.overdueTasks} overdue ${stats.overdueTasks === 1 ? "task" : "tasks"}`,
    );
  }
  if (stats.upcomingThisWeek > 0) {
    parts.push(
      `${stats.upcomingThisWeek} ${stats.upcomingThisWeek === 1 ? "task" : "tasks"} due this week`,
    );
  }
  if (parts.length === 0) return "You're all caught up. Nice work!";
  return `You have ${parts.join(" and ")}. Let's get things done.`;
}

export function DashboardHero({ displayName, stats }: DashboardHeroProps) {
  return (
    <Card className="ring-1 ring-border">
      <CardContent className="flex items-center justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {buildSubtitle(stats)}
          </p>
        </div>
        <CreateTaskMenu label="Create New Task" className="shrink-0" />
      </CardContent>
    </Card>
  );
}
