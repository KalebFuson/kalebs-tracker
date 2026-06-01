"use client";

import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfMonth,
} from "date-fns";
import { useSearchParams } from "next/navigation";

import { applyFilters, parseFilterState } from "@/lib/calendar/filters";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types/calendar";

import { TaskPill } from "./TaskPill";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_TASKS = 3;

type MonthViewProps = {
  tasks: CalendarTask[];
  date: string;
  currentUserId: string;
  myTeamMemberIds: string[];
};

export function MonthView({ tasks, date, currentUserId, myTeamMemberIds }: MonthViewProps) {
  const searchParams = useSearchParams();
  const filterState = parseFilterState(searchParams);
  const filteredTasks = applyFilters(tasks, filterState, currentUserId, myTeamMemberIds);

  const currentDate = parseISO(date);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Group tasks by YYYY-MM-DD key
  const tasksByDate = new Map<string, CalendarTask[]>();
  for (const task of filteredTasks) {
    if (!task.due_date) continue;
    const key = task.due_date.slice(0, 10);
    const existing = tasksByDate.get(key);
    if (existing) existing.push(task);
    else tasksByDate.set(key, [task]);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-7 border-b border-border bg-white">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar cells — border-l/border-t on container + border-r/border-b on each cell = full grid */}
      <div className="grid flex-1 grid-cols-7 overflow-auto border-l border-t border-border">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const overflow = dayTasks.length - MAX_VISIBLE_TASKS;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[110px] border-b border-r border-border p-1.5",
                !isCurrentMonth && "bg-gray-50/70",
              )}
            >
              {/* Date number */}
              <div
                className={cn(
                  "mb-1 flex size-6 items-center justify-center rounded-full text-sm font-medium",
                  isCurrentDay
                    ? "bg-primary text-primary-foreground"
                    : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400",
                )}
              >
                {format(day, "d")}
              </div>

              {/* Task pills */}
              <div className="space-y-0.5">
                {dayTasks.slice(0, MAX_VISIBLE_TASKS).map((task) => (
                  <TaskPill key={task.id} task={task} />
                ))}
                {overflow > 0 && (
                  <p className="cursor-default px-1 text-xs font-medium text-primary">
                    +{overflow} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
