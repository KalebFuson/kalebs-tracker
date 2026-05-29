import Link from "next/link";
import { CalendarDays, LayoutGrid } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTaskKey } from "@/lib/format-task-key";
import type { DashboardTask, TaskPriority, TaskStatus } from "@/types/dashboard";

function formatDueDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const priorityStyles: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const statusStyles: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  in_review: "bg-purple-100 text-purple-800",
  done: "bg-emerald-100 text-emerald-800",
  blocked: "bg-red-100 text-red-800",
};

const statusLabel: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

type UpcomingTasksListProps = {
  tasks: DashboardTask[];
  orgSlug: string;
};

export function UpcomingTasksList({ tasks, orgSlug }: UpcomingTasksListProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">
              Upcoming Tasks
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tasks assigned to you due in the next 7 days.
            </p>
          </div>
          <Link href="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all tasks →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-0 pb-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CalendarDays className="size-8 opacity-30" />
            <p className="text-sm">No tasks due this week.</p>
          </div>
        ) : (
          <ul>
            {tasks.map((task) => (
              // href="/tasks/[id]" will be wired up when the task detail page is built
              <li
                key={task.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-gray-50"
              >
                {/* Visual-only checkbox — will become interactive in the task detail phase */}
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
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${priorityStyles[task.priority]}`}
                  >
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[task.status]}`}
                  >
                    {statusLabel[task.status]}
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
