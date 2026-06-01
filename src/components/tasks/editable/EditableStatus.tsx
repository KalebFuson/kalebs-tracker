"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/actions/update-task";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABEL,
} from "@/lib/task-styles";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/tasks";

const STATUS_OPTION_VALUES: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
];

const STATUS_OPTIONS = STATUS_OPTION_VALUES.map((value) => ({
  value,
  label: STATUS_LABEL[value],
  dot: STATUS_DOT[value],
}));

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
            "flex w-fit cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:ring-1 hover:ring-current/30",
            STATUS_BADGE[optimisticStatus],
            isPending && "opacity-60",
          )}
        >
          <span className="size-2 rounded-full bg-current" />
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
