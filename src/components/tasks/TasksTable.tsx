"use client";

import Link from "next/link";
import { useState } from "react";

import { TaskRow } from "@/components/tasks/TaskRow";
import { Card } from "@/components/ui/card";
import { buildTasksUrl, type TasksUrlParams } from "@/lib/tasks/build-url";
import type { OrgMember, TaskListItem } from "@/types/tasks";

type TasksTableProps = {
  tasks: TaskListItem[];
  total: number;
  pageSize: number;
  orgSlug: string;
  urlParams: TasksUrlParams;
  prevPageHref: string | null;
  nextPageHref: string | null;
  orgMembers: OrgMember[];
  currentUserId: string;
};

export function TasksTable({
  tasks,
  total,
  pageSize,
  orgSlug,
  urlParams,
  prevPageHref,
  nextPageHref,
  orgMembers,
  currentUserId,
}: TasksTableProps) {
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

  const page = urlParams.page;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

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
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No tasks"
            : `Showing ${rangeStart} to ${rangeEnd} of ${total} tasks`}
        </p>
        <div className="flex items-center gap-2">
          {prevPageHref ? (
            <Link
              href={prevPageHref}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-gray-300 cursor-not-allowed">
              Previous
            </span>
          )}
          {nextPageHref ? (
            <Link
              href={nextPageHref}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-gray-300 cursor-not-allowed">
              Next
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
