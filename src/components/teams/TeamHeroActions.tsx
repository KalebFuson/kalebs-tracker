"use client";

import { Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { TeamDetail } from "@/types/teams";

import { NewTaskButton } from "./NewTaskButton";
import { TeamSettingsDialog } from "./TeamSettingsDialog";

type TeamHeroActionsProps = {
  team: TeamDetail;
};

export function TeamHeroActions({ team }: TeamHeroActionsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="text-muted-foreground hover:text-gray-900"
          onClick={() => setSettingsOpen(true)}
          title="Team settings"
        >
          <Settings className="size-4" />
        </Button>
        <NewTaskButton teamId={team.id} />
      </div>

      <TeamSettingsDialog
        team={team}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
