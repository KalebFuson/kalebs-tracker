import Link from "next/link";
import { CheckCircle, AlertCircle, CalendarClock, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  viewLabel?: string;
  valueClassName?: string;
  cardClassName?: string;
  iconBgClassName?: string;
};

function StatCard({
  label,
  value,
  icon,
  href,
  viewLabel = "View all",
  valueClassName = "text-gray-900",
  cardClassName = "",
  iconBgClassName = "bg-indigo-50",
}: StatCardProps) {
  return (
    <Card className={cardClassName}>
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <div className={`rounded-full p-2.5 ${iconBgClassName}`}>{icon}</div>
        </div>
        <p className={`mt-2 text-4xl font-bold ${valueClassName}`}>{value}</p>
        <Link
          href={href}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          {viewLabel}
          <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

type DashboardStatCardsProps = {
  stats: DashboardStats;
};

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
  const isOverdue = stats.overdueTasks > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="My Open Tasks"
        value={stats.openTasks}
        href="/tasks"
        viewLabel="View all tasks"
        icon={<CheckCircle className="size-5 text-indigo-600" />}
        valueClassName="text-gray-900"
        iconBgClassName="bg-indigo-50"
      />
      <StatCard
        label="Overdue Tasks"
        value={stats.overdueTasks}
        href="/tasks?status=overdue"
        viewLabel="View overdue"
        icon={<AlertCircle className={`size-5 ${isOverdue ? "text-red-500" : "text-gray-400"}`} />}
        valueClassName={isOverdue ? "text-red-600" : "text-gray-900"}
        cardClassName={isOverdue ? "bg-red-50 ring-red-100" : ""}
        iconBgClassName={isOverdue ? "bg-red-100" : "bg-gray-100"}
      />
      <StatCard
        label="Upcoming This Week"
        value={stats.upcomingThisWeek}
        href="/calendar"
        viewLabel="Open calendar"
        icon={<CalendarClock className="size-5 text-indigo-600" />}
        valueClassName="text-gray-900"
        iconBgClassName="bg-indigo-50"
      />
    </div>
  );
}
