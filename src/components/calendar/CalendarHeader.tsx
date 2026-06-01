"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { CalendarView } from "@/types/calendar";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

function parseSafeDate(dateStr: string | null): Date {
  if (!dateStr) return new Date();
  try {
    return parseISO(dateStr);
  } catch {
    return new Date();
  }
}

function getDateLabel(view: CalendarView, date: Date): string {
  if (view === "month") return format(date, "MMMM yyyy");
  if (view === "week") {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    if (format(start, "MMM yyyy") === format(end, "MMM yyyy")) {
      return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
    }
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return format(date, "EEEE, MMMM d, yyyy");
}

/** Returns true when the view already contains today, so "Today" means "you are here". */
function isViewingToday(view: CalendarView, date: Date): boolean {
  const today = new Date();
  if (view === "day") return isSameDay(date, today);
  if (view === "week") return isSameWeek(date, today, { weekStartsOn: 1 });
  return isSameMonth(date, today);
}

function navigateDate(view: CalendarView, date: Date, direction: 1 | -1): Date {
  if (view === "month") return addMonths(date, direction);
  if (view === "week") return addWeeks(date, direction);
  return addDays(date, direction);
}

function buildUrl(
  base: URLSearchParams,
  overrides: { view?: CalendarView; date?: string },
): string {
  const p = new URLSearchParams(base);
  if (overrides.view !== undefined) p.set("view", overrides.view);
  if (overrides.date !== undefined) p.set("date", overrides.date);
  return `/calendar?${p.toString()}`;
}

export function CalendarHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = (searchParams.get("view") ?? "month") as CalendarView;
  const dateStr = searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd");
  const date = parseSafeDate(dateStr);
  const atToday = isViewingToday(view, date);

  function navigate(direction: 1 | -1) {
    const newDate = navigateDate(view, date, direction);
    router.push(buildUrl(searchParams, { date: format(newDate, "yyyy-MM-dd") }));
  }

  function goToToday() {
    router.push(buildUrl(searchParams, { date: format(new Date(), "yyyy-MM-dd") }));
  }

  function switchView(newView: CalendarView) {
    router.push(buildUrl(searchParams, { view: newView }));
  }

  return (
    <div className="border-b border-border bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{getDateLabel(view, date)}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Prev / Today / Next */}
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="rounded-l-md border border-border bg-white p-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={atToday ? undefined : goToToday}
              disabled={atToday}
              aria-current={atToday ? "date" : undefined}
              className={cn(
                "border-y border-border px-3 py-1.5 text-sm font-medium transition-colors",
                atToday
                  ? "cursor-default bg-primary/10 text-primary hover:opacity-80"
                  : "bg-white text-gray-700 hover:bg-gray-50",
              )}
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="rounded-r-md border border-border bg-white p-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* View switcher pill */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                onClick={() => switchView(v.value)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  v.value === view
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
