import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { TaskListItem } from "@/types/tasks";

const STATUS_DOT: Record<string, string> = {
  todo: "bg-gray-400",
  in_progress: "bg-blue-500",
  in_review: "bg-purple-500",
  done: "bg-green-500",
  blocked: "bg-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type TeamTasksTabProps = {
  tasks: TaskListItem[];
  teamId: string;
};

export function TeamTasksTab({ tasks, teamId }: TeamTasksTabProps) {
  if (tasks.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <CheckCircle2 className="size-10 text-muted-foreground opacity-30" />
        <div>
          <p className="font-semibold text-gray-900">No tasks yet</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create a task using the &ldquo;New Task&rdquo; button above.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-border bg-gray-50">
            <th className="py-3 pl-4 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Priority
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 pl-4 pr-4">
                <Link
                  href={`/teams/${teamId}?task=${task.task_number}`}
                  className="group block"
                >
                  <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {task.title}
                  </p>
                  {task.assignee_name && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {task.assignee_name}
                    </p>
                  )}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${STATUS_DOT[task.status] ?? "bg-gray-400"}`}
                  />
                  {STATUS_LABEL[task.status] ?? task.status}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </td>
              <td className="py-3 pr-4">
                {task.due_date ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDate(task.due_date)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
