"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { PRIORITY_DOT, STATUS_BORDER, STATUS_LABEL } from "@/lib/task-styles";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types/calendar";

type TaskPillProps = {
  task: CalendarTask;
};

export function TaskPill({ task }: TaskPillProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Append ?task=N to the current URL, preserving all other params
  const p = new URLSearchParams(searchParams);
  p.set("task", String(task.task_number));
  const href = `${pathname}?${p.toString()}`;

  return (
    <Link
      href={href}
      title={`${task.title} — ${STATUS_LABEL[task.status]}`}
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded border-l-[3px] py-0.5 pl-1.5 pr-1 text-xs font-medium text-gray-900 transition-colors hover:bg-gray-100",
        STATUS_BORDER[task.status],
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          PRIORITY_DOT[task.priority],
        )}
      />
      <span className="truncate">{task.title}</span>
    </Link>
  );
}
