"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardCalendarProps = {
  // ISO date strings (YYYY-MM-DD) for open tasks assigned to the current user
  datesWithTasks: string[];
};

export function DashboardCalendar({ datesWithTasks }: DashboardCalendarProps) {
  const router = useRouter();
  const [month, setMonth] = useState<Date>(new Date());

  const taskDateSet = new Set(datesWithTasks);

  function handleDayClick(day: Date) {
    router.push(`/calendar?view=day&date=${format(day, "yyyy-MM-dd")}`);
  }

  const modifiers = {
    hasTasks: (date: Date) => {
      const iso = date.toISOString().slice(0, 10);
      return taskDateSet.has(iso);
    },
  };

  const modifiersClassNames = {
    hasTasks: "rdp-has-tasks",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Calendar</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        {/* Inject a tiny inline style for the dot indicator on task days */}
        <style>{`
          .rdp-has-tasks::after {
            content: '';
            display: block;
            width: 5px;
            height: 5px;
            border-radius: 9999px;
            background-color: #4f46e5;
            margin: 1px auto 0;
          }
        `}</style>
        <Calendar
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={handleDayClick}
          className="mx-auto w-full [&_.rdp-day]:cursor-pointer"
        />
      </CardContent>
    </Card>
  );
}
