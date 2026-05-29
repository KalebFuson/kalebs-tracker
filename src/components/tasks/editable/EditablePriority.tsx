"use client";

import { Flag } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/actions/update-task";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/tasks";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; flagClass: string }[] = [
  { value: "urgent", label: "Urgent", flagClass: "text-red-500" },
  { value: "high", label: "High", flagClass: "text-orange-500" },
  { value: "medium", label: "Medium", flagClass: "text-amber-500" },
  { value: "low", label: "Low", flagClass: "text-gray-400" },
];

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

type EditablePriorityProps = {
  taskId: string;
  currentPriority: TaskPriority;
};

export function EditablePriority({ taskId, currentPriority }: EditablePriorityProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticPriority, setOptimisticPriority] = useOptimistic(currentPriority);

  function handleSelect(newPriority: TaskPriority) {
    if (newPriority === optimisticPriority) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      setOptimisticPriority(newPriority);
      const result = await updateTask({ taskId, updates: { priority: newPriority } });
      if (!result.ok) toast.error(`Failed to update priority: ${result.error}`);
    });
  }

  const label = optimisticPriority.charAt(0).toUpperCase() + optimisticPriority.slice(1);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex w-fit cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:ring-1 hover:ring-current/30",
            PRIORITY_BADGE[optimisticPriority],
            isPending && "opacity-60",
          )}
        >
          {label}
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-100",
                opt.value === optimisticPriority && "font-semibold",
              )}
            >
              <Flag className={cn("size-3.5 shrink-0", opt.flagClass)} />
              {opt.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
