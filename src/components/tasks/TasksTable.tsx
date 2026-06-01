"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TaskRow } from "@/components/tasks/TaskRow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildTasksUrl, type TasksUrlParams } from "@/lib/tasks/build-url";
import type { OrgMember, TaskListItem } from "@/types/tasks";

type TasksTableProps = {
  tasks: TaskListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  orgSlug: string;
  urlParams: TasksUrlParams;
  orgMembers: OrgMember[];
  currentUserId: string;
};

export function TasksTable({
  tasks,
  total,
  page,
  pageSize,
  totalPages,
  orgSlug,
  urlParams,
  orgMembers,
  currentUserId,
}: TasksTableProps) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(taskId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function getTaskDetailHref(taskNumber: number): string {
    return buildTasksUrl(urlParams, { task: String(taskNumber), page: null });
  }

  function goToPage(targetPage: number) {
    router.push(
      buildTasksUrl(urlParams, {
        page: targetPage <= 1 ? null : String(targetPage),
      }),
    );
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const showPageControls = totalPages > 1;

  return (
    <Card className="overflow-hidden p-0 ring-1 ring-border">
      {tasks.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No tasks found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="w-8 pl-3 pr-1" />
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Title
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assignee
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Due Date
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  orgSlug={orgSlug}
                  isExpanded={expandedIds.has(task.id)}
                  onToggleExpand={toggleExpand}
                  taskDetailHref={getTaskDetailHref(task.task_number)}
                  orgMembers={orgMembers}
                  currentUserId={currentUserId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No tasks"
            : `Showing ${rangeStart} to ${rangeEnd} of ${total} tasks`}
          {total > 0 && (
            <span className="text-muted-foreground">
              {" "}
              · Page {page} of {totalPages}
            </span>
          )}
        </p>
        {showPageControls && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canPrev}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canNext}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
