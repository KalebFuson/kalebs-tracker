import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTeam } from "@/types/dashboard";

type MyTeamsPanelProps = {
  teams: DashboardTeam[];
};

export function MyTeamsPanel({ teams }: MyTeamsPanelProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">
            My Teams
          </CardTitle>
          <Link href="/teams" className="text-muted-foreground hover:text-gray-900 transition-colors">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {teams.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            You haven&apos;t been added to any teams yet.
          </p>
        ) : (
          <ul>
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <Building2 className="size-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {team.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                    {team.department ? ` · ${team.department}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-gray-900">{team.openTaskCount}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tasks
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
