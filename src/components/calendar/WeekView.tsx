"use client";

import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useSearchParams } from "next/navigation";

import { applyFilters, parseFilterState } from "@/lib/calendar/filters";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types/calendar";

import { TaskCard } from "./TaskCard";

type WeekViewProps = {
  tasks: CalendarTask[];
  date: string;
  currentUserId: string;
  myTeamMemberIds: string[];
};

export function WeekView({ tasks, date, currentUserId, myTeamMemberIds }: WeekViewProps) {
  const searchParams = useSearchParams();
  const filterState = parseFilterState(searchParams);
  const filteredTasks = applyFilters(tasks, filterState, currentUserId, myTeamMemberIds);

  const currentDate = parseISO(date);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group tasks by date key
  const tasksByDate = new Map<string, CalendarTask[]>();
  for (const task of filteredTasks) {
    if (!task.due_date) continue;
    const key = task.due_date.slice(0, 10);
    const existing = tasksByDate.get(key);
    if (existing) existing.push(task);
    else tasksByDate.set(key, [task]);
  }

  return (
    <div className="flex h-full overflow-x-auto">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayTasks = tasksByDate.get(key) ?? [];
        const isCurrentDay = isToday(day);

        return (
          <div
            key={key}
            className={cn(
              "flex min-w-[150px] flex-1 flex-col border-r border-border",
              isCurrentDay && "bg-indigo-50/20",
            )}
          >
            {/* Column header */}
            <div
              className={cn(
                "shrink-0 border-b border-border px-3 py-2.5 text-center",
                isCurrentDay && "bg-indigo-50",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {format(day, "EEE")}
              </p>
              <p
                className={cn(
                  "text-xl font-semibold leading-tight",
                  isCurrentDay ? "text-indigo-600" : "text-gray-900",
                )}
              >
                {format(day, "d")}
              </p>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {dayTasks.length === 0 && (
                <p className="mt-2 text-center text-xs text-muted-foreground/60">—</p>
              )}
              {dayTasks.map((task) => (
                <TaskCard key={task.id} task={task} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
