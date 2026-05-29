"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/actions/update-task";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/tasks";

const STATUS_OPTIONS: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "todo", label: "To Do", dot: "bg-gray-400" },
  { value: "in_progress", label: "In Progress", dot: "bg-blue-500" },
  { value: "in_review", label: "In Review", dot: "bg-purple-500" },
  { value: "done", label: "Done", dot: "bg-green-500" },
  { value: "blocked", label: "Blocked", dot: "bg-red-500" },
];

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

type EditableStatusProps = {
  taskId: string;
  currentStatus: TaskStatus;
};

export function EditableStatus({ taskId, currentStatus }: EditableStatusProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

  function handleSelect(newStatus: TaskStatus) {
    if (newStatus === optimisticStatus) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      const result = await updateTask({ taskId, updates: { status: newStatus } });
      if (!result.ok) toast.error(`Failed to update status: ${result.error}`);
    });
  }

  return (
    // stopPropagation prevents this click from triggering any parent row handlers
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex w-fit cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:ring-1 hover:ring-current/30",
            STATUS_BADGE[optimisticStatus],
            isPending && "opacity-60",
          )}
        >
          <span className="size-1.5 rounded-full bg-current opacity-70" />
          {STATUS_LABEL[optimisticStatus]}
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-100",
                opt.value === optimisticStatus && "font-semibold",
              )}
            >
              <span className={cn("size-2 shrink-0 rounded-full", opt.dot)} />
              {opt.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
