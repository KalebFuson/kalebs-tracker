import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { DayView } from "@/components/calendar/DayView";
import { FilterSidebar } from "@/components/calendar/FilterSidebar";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { createClient } from "@/lib/supabase/server";
import {
  getMyTeamMemberIds,
  getOrgMembersForCalendar,
  getOrgTags,
  getTasksForCalendar,
} from "@/lib/calendar/queries";
import { getOrgTeamsList } from "@/lib/teams/queries";
import type { CalendarView, DateRange } from "@/types/calendar";

type CalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseView(raw: string | string[] | undefined): CalendarView {
  const v = String(raw ?? "month");
  if (v === "week" || v === "day") return v;
  return "month";
}

function parseSafeDateStr(raw: string | string[] | undefined): string {
  const s = String(raw ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return format(new Date(), "yyyy-MM-dd");
}

function computeDateRange(view: CalendarView, dateStr: string): DateRange {
  const date = parseISO(dateStr);

  if (view === "month") {
    const gridStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    return {
      from: format(gridStart, "yyyy-MM-dd"),
      to: format(gridEnd, "yyyy-MM-dd"),
    };
  }

  if (view === "week") {
    return {
      from: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      to: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }

  // day
  return { from: dateStr, to: dateStr };
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;

  const view = parseView(params.view);
  const dateStr = parseSafeDateStr(params.date);
  const dateRange = computeDateRange(view, dateStr);

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.org_id) redirect("/onboarding");
  const orgId = membership.org_id;

  // Parallel data fetches
  const [tasks, orgMembers, orgTags, myTeamMemberIds, orgTeams] = await Promise.all([
    getTasksForCalendar(orgId, dateRange),
    getOrgMembersForCalendar(orgId),
    getOrgTags(orgId),
    getMyTeamMemberIds(orgId, user.id),
    getOrgTeamsList(orgId),
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top header bar */}
      <Suspense>
        <CalendarHeader />
      </Suspense>

      {/* Two-column layout: sidebar + view */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Filter sidebar */}
        <Suspense>
          <FilterSidebar
            orgMembers={orgMembers}
            orgTags={orgTags}
            orgTeams={orgTeams}
            currentUserId={user.id}
          />
        </Suspense>

        {/* Active view */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <Suspense>
            {view === "month" && (
              <MonthView
                tasks={tasks}
                date={dateStr}
                currentUserId={user.id}
                myTeamMemberIds={myTeamMemberIds}
              />
            )}
            {view === "week" && (
              <WeekView
                tasks={tasks}
                date={dateStr}
                currentUserId={user.id}
                myTeamMemberIds={myTeamMemberIds}
              />
            )}
            {view === "day" && (
              <DayView
                tasks={tasks}
                date={dateStr}
                currentUserId={user.id}
                myTeamMemberIds={myTeamMemberIds}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
