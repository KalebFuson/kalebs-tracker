import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Users, AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamDetail } from "@/types/teams";

type TeamStatsCardProps = {
  team: TeamDetail;
};

export function TeamStatsCard({ team }: TeamStatsCardProps) {
  const stats = [
    {
      label: "Active Tasks",
      value: team.active_task_count,
      icon: Clock,
      valueClass: "text-blue-600",
    },
    {
      label: "Members",
      value: team.members.length,
      icon: Users,
      valueClass: "text-gray-900",
    },
    {
      label: "Overdue",
      value: team.overdue_task_count,
      icon: AlertCircle,
      valueClass: team.overdue_task_count > 0 ? "text-red-600" : "text-gray-900",
    },
    {
      label: "Completed",
      value: team.completed_task_count,
      icon: CheckCircle2,
      valueClass: "text-green-600",
    },
  ];

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900">Team Stats</CardTitle>
        <p className="text-xs text-muted-foreground">Key performance indicators.</p>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="size-4 shrink-0" />
              {s.label}
            </div>
            <span className={`text-base font-bold ${s.valueClass}`}>{s.value}</span>
          </div>
        ))}

        <div className="border-t border-border pt-3">
          <Link
            href={`/calendar?team=${team.id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <CalendarDays className="size-4" />
            View team calendar →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
