"use client";

import { Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { TeamDetail } from "@/types/teams";

import type { TeamJoinState } from "@/lib/teams/join-state";

import { NewTaskButton } from "./NewTaskButton";
import { RequestToJoinButton } from "./RequestToJoinButton";
import { TeamSettingsDialog } from "./TeamSettingsDialog";

type TeamHeroActionsProps = {
  team: TeamDetail;
  isAdmin: boolean;
  joinState: TeamJoinState;
};

export function TeamHeroActions({ team, isAdmin, joinState }: TeamHeroActionsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <RequestToJoinButton teamId={team.id} joinState={joinState} />
        {isAdmin && (
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-gray-900"
            onClick={() => setSettingsOpen(true)}
            title="Team settings"
          >
            <Settings className="size-4" />
          </Button>
        )}
        <NewTaskButton teamId={team.id} />
      </div>

      {isAdmin && (
        <TeamSettingsDialog
          team={team}
          isAdmin={isAdmin}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </>
  );
}
