"use client";

import { useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { updateMemberRole } from "@/app/actions/org-member";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Role = "member" | "admin";

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-indigo-100 text-indigo-700",
  member: "bg-gray-100 text-gray-600",
};

type InlineRoleEditorProps = {
  memberId: string;
  currentRole: Role;
  editable: boolean;
};

export function InlineRoleEditor({ memberId, currentRole, editable }: InlineRoleEditorProps) {
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

  function changeRole(newRole: Role) {
    if (newRole === currentRole) return;
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={isPending} className="focus:outline-none">
        {badge}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {(["member", "admin"] as Role[]).map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => changeRole(role)}
            className="flex items-center justify-between capitalize"
          >
            {role}
            {role === currentRole && <Check className="size-3.5 text-indigo-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
