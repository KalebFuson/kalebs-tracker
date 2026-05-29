"use client";

import { Copy, MoreHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { TaskActivityFeed } from "@/components/tasks/TaskActivityFeed";
import { TaskDetailMetadata } from "@/components/tasks/TaskDetailMetadata";
import { TaskDetailSubtasks } from "@/components/tasks/TaskDetailSubtasks";
import { EditableDescription } from "@/components/tasks/editable/EditableDescription";
import { EditableTitle } from "@/components/tasks/editable/EditableTitle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatTaskKey } from "@/lib/format-task-key";
import type { OrgMember, TaskDetail } from "@/types/tasks";

type TaskDetailSheetProps = {
  task: TaskDetail | null;
  orgSlug: string;
  closeHref: string;
  orgMembers: OrgMember[];
  currentUserId: string;
};

export function TaskDetailSheet({
  task,
  orgSlug,
  closeHref,
  orgMembers,
  currentUserId,
}: TaskDetailSheetProps) {
  const router = useRouter();

  function close() {
    router.push(closeHref);
  }

  return (
    <Sheet
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[720px] p-0 overflow-y-auto"
      >
        {task && (
          <div className="flex min-h-full flex-col">
            {/* ── Header: breadcrumb row + action buttons + editable title ── */}
            <div className="border-b border-border p-6">
              {/* Top micro-row: breadcrumb left, actions right */}
              <div className="mb-3 flex items-start justify-between gap-4">
                <p className="text-sm text-muted-foreground leading-snug">
                  {task.team_name && (
                    <>
                      <span>{task.team_name}</span>
                      <span className="mx-1.5 opacity-40">/</span>
                    </>
                  )}
                  <span className="font-medium text-gray-600">
                    {formatTaskKey(orgSlug, task.task_number)}
                  </span>
                </p>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => console.log("Copy link — not implemented")}
                    title="Copy link"
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => console.log("More options — not implemented")}
                    title="More options"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={close} title="Close">
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <EditableTitle taskId={task.id} currentTitle={task.title} />
            </div>

            {/* ── Body: 2-column grid ── */}
            {/*
              md:grid-cols-3 fires at ≥768px viewport — safe on any desktop where
              this 720px panel appears. Left col (md:col-span-2) gets ~2/3 ≈ 448px;
              right col gets ~1/3 ≈ 204px. Below md it stacks vertically.
            */}
            <div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-3">
              {/* Left — Description + Subtasks */}
              <div className="space-y-6 md:col-span-2">
                <EditableDescription
                  taskId={task.id}
                  currentDescription={task.description}
                />
                <TaskDetailSubtasks
                  subtasks={task.subtasks}
                  completedCount={task.completed_subtask_count}
                />
              </div>

              {/* Right — Details card + Activity */}
              <div className="space-y-6">
                <TaskDetailMetadata
                  taskId={task.id}
                  status={task.status}
                  priority={task.priority}
                  assignee_id={task.assignee_id}
                  due_date={task.due_date}
                  tag_names={task.tag_names}
                  orgMembers={orgMembers}
                  currentUserId={currentUserId}
                />
                <TaskActivityFeed activity={task.activity} />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
