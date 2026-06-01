import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TeamDetail } from "@/types/teams";

import { AvatarStack } from "./AvatarStack";
import { TeamHeroActions } from "./TeamHeroActions";

const DEPT_COLORS: Record<string, string> = {
  Engineering: "from-blue-500 to-blue-600",
  Design: "from-purple-500 to-purple-600",
  Product: "from-indigo-500 to-indigo-600",
  Marketing: "from-pink-500 to-pink-600",
  Operations: "from-amber-500 to-amber-600",
  Sales: "from-green-500 to-green-600",
  HR: "from-rose-500 to-rose-600",
  Other: "from-gray-400 to-gray-500",
};

function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type TeamHeroProps = {
  team: TeamDetail;
  isAdmin: boolean;
};

export function TeamHero({ team, isAdmin }: TeamHeroProps) {
  const gradient =
    team.department
      ? (DEPT_COLORS[team.department] ?? "from-gray-400 to-gray-500")
      : "from-indigo-500 to-indigo-600";

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-xs">
      {/* Top nav row */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          href="/teams"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Teams
        </Link>
        <TeamHeroActions team={team} isAdmin={isAdmin} />
      </div>

      {/* Hero row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {/* Team avatar */}
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-sm",
              gradient,
            )}
          >
            {teamInitials(team.name)}
          </div>

          {/* Name + description */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              {team.department && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {team.department}
                </span>
              )}
            </div>
            {team.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{team.description}</p>
            )}
          </div>
        </div>

        {/* Avatar stack + View Members */}
        <div className="flex shrink-0 items-center gap-3">
          <AvatarStack members={team.members} max={4} size="md" />
          <Link href={`/teams/${team.id}?tab=overview`}>
            <Button variant="outline" size="sm">
              View Members
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
