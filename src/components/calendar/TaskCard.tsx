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

const STATUS_DOT: Record<string, string> = {
  todo: "bg-gray-400",
  in_progress: "bg-blue-500",
  in_review: "bg-purple-500",
  done: "bg-green-500",
  blocked: "bg-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

type TaskCardProps = {
  task: CalendarTask;
  /** Compact mode trims metadata — used in WeekView columns */
  compact?: boolean;
};

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Append ?task=N to the current URL, preserving all other params
  const p = new URLSearchParams(searchParams);
  p.set("task", String(task.task_number));
  const href = `${pathname}?${p.toString()}`;

  const isDone = task.status === "done";

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-lg border border-border bg-white p-2.5 shadow-xs",
        "hover:border-indigo-300 hover:shadow-sm transition-all",
        isDone && "opacity-60",
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-[3px] size-2 shrink-0 rounded-full",
            STATUS_DOT[task.status] ?? "bg-gray-400",
          )}
          title={STATUS_LABEL[task.status]}
        />
        <p
          className={cn(
            "font-medium text-gray-900 group-hover:text-indigo-600 transition-colors",
            compact ? "text-xs line-clamp-1" : "text-sm line-clamp-2",
          )}
        >
          {task.title}
        </p>
      </div>

      {!compact && (
        <>
          {/* Badges row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {task.team_name && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                {task.team_name}
              </span>
            )}
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                PRIORITY_BADGE[task.priority] ?? "bg-gray-100 text-gray-600",
              )}
            >
              <span
                className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
              />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {task.tag_names.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600"
              >
                {tag}
              </span>
            ))}
            {task.tag_names.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{task.tag_names.length - 2}
              </span>
            )}
          </div>

          {/* Assignee */}
          {task.assignee_name && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {task.assignee_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.assignee_avatar}
                  alt={task.assignee_name}
                  className="size-4 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-4 items-center justify-center rounded-full bg-indigo-200 text-[8px] font-bold text-indigo-700">
                  {task.assignee_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate text-[10px] text-gray-500">{task.assignee_name}</span>
            </div>
          )}
        </>
      )}
    </Link>
  );
}
