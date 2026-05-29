"use client";

import Link from "next/link";
import { ArrowRight, CheckSquare, Settings, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TeamListItem } from "@/types/teams";

import { AvatarStack } from "./AvatarStack";
import { TeamSettingsDialog } from "./TeamSettingsDialog";

type TeamCardProps = {
  team: TeamListItem;
};

const DEPT_COLORS: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700",
  Design: "bg-purple-50 text-purple-700",
  Product: "bg-indigo-50 text-indigo-700",
  Marketing: "bg-pink-50 text-pink-700",
  Operations: "bg-amber-50 text-amber-700",
  Sales: "bg-green-50 text-green-700",
  HR: "bg-rose-50 text-rose-700",
  Other: "bg-gray-100 text-gray-600",
};

export function TeamCard({ team }: TeamCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const deptColor = team.department
    ? (DEPT_COLORS[team.department] ?? "bg-gray-100 text-gray-600")
    : null;

  return (
    <>
      <Card className="flex flex-col gap-0 p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-5 flex-1">
          {/* Top row: department badge */}
          <div className="flex items-center justify-between">
            {deptColor && team.department ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  deptColor,
                )}
              >
                {team.department}
              </span>
            ) : (
              <span />
            )}
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{team.name}</h3>

          {/* Description */}
          {team.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{team.description}</p>
          )}
          {!team.description && <div className="flex-1" />}
        </div>

        {/* Divider + stats */}
        <div className="border-t border-border px-5 py-3">
          <div className="flex items-center gap-6">
            {/* Members */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Users className="size-3" />
                Members
              </span>
              <div className="flex items-center gap-2">
                <AvatarStack members={team.members} max={3} size="sm" />
                {team.member_count > 3 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    +{team.member_count - 3}
                  </span>
                )}
                {team.member_count === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {/* Active Tasks */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <CheckSquare className="size-3" />
                Active Tasks
              </span>
              <span className="text-xl font-bold text-gray-900">{team.active_task_count}</span>
            </div>
          </div>
        </div>

        {/* Bottom: Open team button + settings icon */}
        <div className="border-t border-border px-5 py-3 flex items-center gap-2">
          <Link href={`/teams/${team.id}`} className="flex-1">
            <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
              Open team <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              setSettingsOpen(true);
            }}
            title="Team settings"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </Card>

      <TeamSettingsDialog
        team={team}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
