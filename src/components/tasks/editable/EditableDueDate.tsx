"use client";

import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/actions/update-task";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type EditableDueDateProps = {
  taskId: string;
  currentDueDate: string | null;
};

function formatDisplay(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr + "T00:00:00");
  return format(date, "MMM d, yyyy");
}

export function EditableDueDate({ taskId, currentDueDate }: EditableDueDateProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticDate, setOptimisticDate] = useOptimistic(currentDueDate);

  function saveDate(newDate: string | null) {
    if (newDate === optimisticDate) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      setOptimisticDate(newDate);
      const result = await updateTask({ taskId, updates: { due_date: newDate } });
      if (!result.ok) toast.error(`Failed to update due date: ${result.error}`);
    });
  }

  const selectedDate = optimisticDate ? new Date(optimisticDate + "T00:00:00") : undefined;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-sm transition-colors hover:bg-gray-100",
            optimisticDate ? "text-gray-700" : "text-muted-foreground",
            isPending && "opacity-60",
          )}
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
          {formatDisplay(optimisticDate)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => saveDate(date ? format(date, "yyyy-MM-dd") : null)}
          />
          {optimisticDate && (
            <div className="border-t border-border px-3 pb-2">
              <button
                onClick={() => saveDate(null)}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-gray-50 hover:text-red-600"
              >
                <X className="size-3.5" />
                Clear date
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
