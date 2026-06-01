import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABEL,
} from "@/lib/task-styles";
import type { TaskListItem } from "@/types/tasks";

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
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status]}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${STATUS_DOT[task.status]}`}
                  />
                  {STATUS_LABEL[task.status]}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}
                >
                  {PRIORITY_LABEL[task.priority]}
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
