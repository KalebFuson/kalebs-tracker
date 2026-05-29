"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { removeMember } from "@/app/actions/org-member";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RemoveMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
};

export function RemoveMemberDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
}: RemoveMemberDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${memberName} removed from the organization.`);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            Remove <span className="font-medium text-gray-900">{memberName}</span> from the
            organization? They will lose access immediately. Tasks assigned to them will be
            unassigned. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Removing…" : "Remove member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
