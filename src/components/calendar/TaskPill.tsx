"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types/calendar";

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-gray-400",
};

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
      className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          PRIORITY_DOT[task.priority] ?? "bg-gray-400",
        )}
      />
      <span className="truncate">{task.title}</span>
    </Link>
  );
}
