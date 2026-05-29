"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrgTeam } from "@/types/teams";

import { InviteMembersDialog } from "./InviteMembersDialog";

type TeamInviteCardProps = {
  teamId: string;
  orgTeams: OrgTeam[];
};

export function TeamInviteCard({ teamId, orgTeams }: TeamInviteCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900">Invite to Team</CardTitle>
          <p className="text-xs text-muted-foreground">
            Send invite links to new members.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setOpen(true)}
          >
            <Mail className="size-4" />
            Invite New Members
          </Button>
        </CardContent>
      </Card>

      <InviteMembersDialog
        open={open}
        onOpenChange={setOpen}
        defaultTeamId={teamId}
        orgTeams={orgTeams}
      />
    </>
  );
}
