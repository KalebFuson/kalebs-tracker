"use client";

import { useState } from "react";
import { MoreHorizontal, UserMinus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RemoveMemberDialog } from "./RemoveMemberDialog";

type MemberActionsMenuProps = {
  memberId: string;
  memberName: string;
};

export function MemberActionsMenu({ memberId, memberName }: MemberActionsMenuProps) {
  const [removeOpen, setRemoveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-gray-100 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setRemoveOpen(true)}
            className="gap-2"
          >
            <UserMinus className="size-3.5" />
            Remove from org
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RemoveMemberDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        memberId={memberId}
        memberName={memberName}
      />
    </>
  );
}
