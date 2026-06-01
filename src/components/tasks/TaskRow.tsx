"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

import { EditableAssignee } from "@/components/tasks/editable/EditableAssignee";
import { EditableDueDate } from "@/components/tasks/editable/EditableDueDate";
import { EditablePriority } from "@/components/tasks/editable/EditablePriority";
import { EditableStatus } from "@/components/tasks/editable/EditableStatus";
import { formatTaskKey } from "@/lib/format-task-key";
import { cn } from "@/lib/utils";
import type { OrgMember, TaskListItem } from "@/types/tasks";

type TaskRowProps = {
  task: TaskListItem;
  orgSlug: string;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  taskDetailHref: string;
  orgMembers: OrgMember[];
  currentUserId: string;
};

export function TaskRow({
  task,
  orgSlug,
  isExpanded,
  onToggleExpand,
  taskDetailHref,
  orgMembers,
  currentUserId,
}: TaskRowProps) {
  const taskKey = formatTaskKey(orgSlug, task.task_number);

  return (
    <>
      {/* Main row */}
      <tr
        className={cn(
          "group/row border-b border-border transition-colors",
          isExpanded ? "bg-primary/10" : "hover:bg-gray-50",
        )}
      >
        {/* Expand chevron */}
        <td className="w-8 pl-3 pr-1 py-3">
          <button
            onClick={() => onToggleExpand(task.id)}
            className="flex items-center justify-center rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label={isExpanded ? "Collapse row" : "Expand row"}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </td>

        {/* Title */}
        <td className="py-3 pr-4">
          <Link href={taskDetailHref} className="group/title block">
            <p className="text-sm font-medium text-gray-900 group-hover/title:text-primary transition-colors">
              {task.title}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{taskKey}</p>
          </Link>
        </td>

        {/* Assignee */}
        <td className="py-3 pr-4">
          <EditableAssignee
            taskId={task.id}
            currentAssigneeId={task.assignee_id}
            orgMembers={orgMembers}
            currentUserId={currentUserId}
          />
        </td>

        {/* Due Date */}
        <td className="py-3 pr-4">
          <EditableDueDate taskId={task.id} currentDueDate={task.due_date} />
        </td>

        {/* Priority */}
        <td className="py-3 pr-4">
          <EditablePriority taskId={task.id} currentPriority={task.priority} />
        </td>

        {/* Status */}
        <td className="py-3 pr-4">
          <EditableStatus taskId={task.id} currentStatus={task.status} />
        </td>
      </tr>

      {/* Expanded inline detail */}
      {isExpanded && (
        <tr className="border-b border-border bg-primary/10">
          <td />
          <td colSpan={5} className="pb-4 pt-2 pr-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Description */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </p>
                {task.description ? (
                  <p className="line-clamp-3 text-sm text-gray-900">{task.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description.</p>
                )}
              </div>

              {/* Subtasks preview */}
              {task.subtask_count > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subtasks
                  </p>
                  <p className="text-sm text-gray-600">
                    {task.completed_subtask_count} of {task.subtask_count} completed
                  </p>
                  <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${task.subtask_count > 0 ? Math.round((task.completed_subtask_count / task.subtask_count) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Link
              href={taskDetailHref}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
            >
              View Full Task Details
              <ChevronRight className="size-3.5" />
            </Link>
          </td>
        </tr>
      )}
    </>
  );
}
