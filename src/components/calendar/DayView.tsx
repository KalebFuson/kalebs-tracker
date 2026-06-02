"use client";

import { format, parseISO } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { CreateTaskMenu } from "@/components/tasks/CreateTaskMenu";
import { applyFilters, parseFilterState } from "@/lib/calendar/filters";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types/calendar";

import { TaskCard } from "./TaskCard";

type DayViewProps = {
  tasks: CalendarTask[];
  date: string;
  currentUserId: string;
  myTeamMemberIds: string[];
};

export function DayView({ tasks, date, currentUserId, myTeamMemberIds }: DayViewProps) {
  const searchParams = useSearchParams();
  const filterState = parseFilterState(searchParams);
  const filteredTasks = applyFilters(tasks, filterState, currentUserId, myTeamMemberIds);

  const currentDate = parseISO(date);
  const openTasks = filteredTasks.filter((t) => t.status !== "done");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");
  const allDone = filteredTasks.length > 0 && openTasks.length === 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{"Today's Focus"}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {filteredTasks.length === 0
                ? `No tasks scheduled for ${format(currentDate, "EEEE, MMM d")}.`
                : openTasks.length === 0
                  ? "All tasks complete \u2014 enjoy your day!"
                  : `You have ${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} due today.`}
            </p>
          </div>
          <CreateTaskMenu label="New Task Today" className="shrink-0" />
        </div>

        {/* Open tasks */}
        {openTasks.length > 0 && (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <div className={cn("space-y-2", openTasks.length > 0 && "mt-6")}>
            {doneTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Empty / all-done state */}
        {(filteredTasks.length === 0 || allDone) && (
          <div
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-white py-12 text-center",
              filteredTasks.length > 0 && "mt-6",
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="size-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{"That's everything for today!"}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {"You've reached the end of your scheduled tasks for "}
                {format(currentDate, "EEEE, MMM d")}. Enjoy the rest of your day.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
