import Link from "next/link";
import { CalendarDays, LayoutGrid } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTaskKey } from "@/lib/format-task-key";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
} from "@/lib/task-styles";
import type { DashboardTask } from "@/types/dashboard";

function formatDueDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSelectedDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type UpcomingTasksListProps = {
  tasks: DashboardTask[];
  orgSlug: string;
  selectedDay?: string | null;
  onClearDay?: () => void;
};

export function UpcomingTasksList({
  tasks,
  orgSlug,
  selectedDay,
  onClearDay,
}: UpcomingTasksListProps) {
  const isDayView = selectedDay != null && selectedDay !== "";

  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {isDayView ? (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Tasks for {formatSelectedDayHeader(selectedDay)}
                  </CardTitle>
                  {onClearDay && (
                    <button
                      type="button"
                      onClick={onClearDay}
                      className="text-xs font-medium text-primary hover:text-primary/80"
                    >
                      ← Back to upcoming
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tasks due this day.
                </p>
              </>
            ) : (
              <>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Upcoming Tasks
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tasks assigned to you due in the next 7 days.
                </p>
              </>
            )}
          </div>
          <Link
            href="/tasks"
            className="shrink-0 text-sm font-medium text-primary hover:text-primary/80"
          >
            View all tasks →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-0 pb-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CalendarDays className="size-8 opacity-30" />
            <p className="text-sm">
              {isDayView ? "No tasks due on this day." : "No tasks due this week."}
            </p>
          </div>
        ) : (
          <ul>
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-gray-50"
              >
                <div className="size-4 shrink-0 rounded border-2 border-gray-300" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3">
                    {task.due_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="size-3" />
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                    {task.team_name && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LayoutGrid className="size-3" />
                        {task.team_name}
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground/60">
                      {formatTaskKey(orgSlug, task.task_number)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status]}`}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
