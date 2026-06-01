"use client";

import { useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { updateTeamMemberRole } from "@/app/actions/team";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type TeamMemberRole = "member" | "admin";

const ROLE_STYLES: Record<TeamMemberRole, string> = {
  admin: "bg-primary/15 text-primary",
  member: "bg-gray-100 text-gray-600",
};

export function normalizeTeamMemberRole(role: string | null): TeamMemberRole {
  return role === "admin" ? "admin" : "member";
}

type InlineTeamRoleEditorProps = {
  teamMemberId: string;
  currentRole: TeamMemberRole;
  editable: boolean;
};

export function InlineTeamRoleEditor({
  teamMemberId,
  currentRole,
  editable,
}: InlineTeamRoleEditorProps) {
  const [isPending, startTransition] = useTransition();

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        ROLE_STYLES[currentRole],
        editable && "cursor-pointer pr-1.5 hover:opacity-80 transition-opacity",
        isPending && "opacity-50",
      )}
    >
      {currentRole}
      {editable && <ChevronDown className="size-3" />}
    </span>
  );

  if (!editable) return badge;

  function changeRole(newRole: TeamMemberRole) {
    if (newRole === currentRole) return;
    startTransition(async () => {
      const result = await updateTeamMemberRole(teamMemberId, newRole);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={isPending} className="focus:outline-none">
        {badge}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {(["member", "admin"] as TeamMemberRole[]).map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => changeRole(role)}
            className="flex items-center justify-between capitalize"
          >
            {role}
            {role === currentRole && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
