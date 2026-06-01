"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  PRIORITY_BADGE,
  PRIORITY_DOT,
  STATUS_DOT,
  STATUS_LABEL,
} from "@/lib/task-styles";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types/calendar";

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
        "hover:border-primary/40 hover:shadow-sm transition-all",
        isDone && "opacity-60",
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-[3px] size-2 shrink-0 rounded-full",
            STATUS_DOT[task.status],
          )}
          title={STATUS_LABEL[task.status]}
        />
        <p
          className={cn(
            "font-medium text-gray-900 group-hover:text-primary transition-colors",
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
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                {task.team_name}
              </span>
            )}
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
                PRIORITY_BADGE[task.priority],
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
                className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
            {task.tag_names.length > 2 && (
              <span className="text-xs text-muted-foreground">
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
                <div className="flex size-4 items-center justify-center rounded-full bg-primary/15 text-[8px] font-bold text-primary">
                  {task.assignee_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate text-xs text-gray-600">{task.assignee_name}</span>
            </div>
          )}
        </>
      )}
    </Link>
  );
}
