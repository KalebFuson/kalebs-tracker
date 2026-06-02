"use client";

import { useState } from "react";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardCalendarProps = {
  datesWithTasks: string[];
  selectedDay?: string | null;
  onSelectDay?: (day: string) => void;
};

export function DashboardCalendar({
  datesWithTasks,
  selectedDay = null,
  onSelectDay,
}: DashboardCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date());

  const taskDateSet = new Set(datesWithTasks);

  function handleDayClick(day: Date) {
    const iso = format(day, "yyyy-MM-dd");
    onSelectDay?.(iso);
  }

  const modifiers = {
    hasTasks: (date: Date) => taskDateSet.has(format(date, "yyyy-MM-dd")),
    selected: (date: Date) =>
      selectedDay != null && format(date, "yyyy-MM-dd") === selectedDay,
  };

  const modifiersClassNames = {
    hasTasks: "rdp-has-tasks",
    selected:
      "ring-2 ring-primary ring-inset text-primary font-semibold rounded-md bg-transparent",
  };

  return (
    <Card data-tour="calendar">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Calendar</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <style>{`
          .rdp-has-tasks::after {
            content: '';
            display: block;
            width: 5px;
            height: 5px;
            border-radius: 9999px;
            background-color: var(--primary);
            margin: 1px auto 0;
          }
          .dashboard-calendar [data-selected-single="true"] {
            background: transparent !important;
            color: var(--primary) !important;
            font-weight: 600;
          }
          .dashboard-calendar .rdp-today:has([data-selected-single="true"]) {
            background-color: transparent;
          }
        `}</style>
        <Calendar
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={handleDayClick}
          className="dashboard-calendar mx-auto w-full [&_.rdp-day]:cursor-pointer"
        />
      </CardContent>
    </Card>
  );
}
