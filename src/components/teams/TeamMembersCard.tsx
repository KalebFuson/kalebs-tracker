"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserMinus, UserPlus } from "lucide-react";

import { removeTeamMember } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrgMember } from "@/types/tasks";
import type { TeamMember } from "@/types/teams";

import { AddMemberDialog } from "./AddMemberDialog";

type TeamMembersCardProps = {
  teamId: string;
  members: TeamMember[];
  orgMembers: OrgMember[];
  currentUserId: string;
};

function MemberRow({
  member,
  teamId,
  currentUserId,
}: {
  member: TeamMember;
  teamId: string;
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isMe = member.user_id === currentUserId;

  const name = member.full_name ?? member.email;
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeTeamMember(member.id, teamId);
      if (!result.ok) toast.error(result.error);
      else toast.success("Member removed.");
    });
  }

  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      {/* Avatar */}
      <div className="size-8 shrink-0 rounded-full overflow-hidden bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatar_url} alt={name} className="size-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Name + role */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {name}
          {isMe && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
        </p>
        {member.role && (
          <p className="truncate text-xs text-muted-foreground">{member.role}</p>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        title="Remove from team"
      >
        <UserMinus className="size-3.5" />
      </button>
    </li>
  );
}

export function TeamMembersCard({
  teamId,
  members,
  orgMembers,
  currentUserId,
}: TeamMembersCardProps) {
  const [addOpen, setAddOpen] = useState(false);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const nonMembers = orgMembers.filter((m) => !memberUserIds.has(m.id));

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900">Team Members</CardTitle>
              <p className="text-xs text-muted-foreground">
                All members of this team.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-2">
          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <ul>
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  teamId={teamId}
                  currentUserId={currentUserId}
                />
              ))}
            </ul>
          )}

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-1.5"
            onClick={() => setAddOpen(true)}
            disabled={nonMembers.length === 0}
          >
            <UserPlus className="size-4" />
            Add Member
          </Button>
        </CardContent>
      </Card>

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        teamId={teamId}
        nonMembers={nonMembers}
      />
    </>
  );
}
