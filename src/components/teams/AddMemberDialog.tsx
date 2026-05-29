"use client";

import { useState, useTransition } from "react";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { addTeamMember } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { OrgMember } from "@/types/tasks";

type AddMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  nonMembers: OrgMember[];
};

function memberInitials(member: OrgMember): string {
  const name = member.full_name ?? member.email;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function AddMemberDialog({
  open,
  onOpenChange,
  teamId,
  nonMembers,
}: AddMemberDialogProps) {
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = nonMembers.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (m.full_name?.toLowerCase().includes(q) ?? false) ||
      m.email.toLowerCase().includes(q)
    );
  });

  function handleAdd(member: OrgMember) {
    setAddingId(member.id);
    startTransition(async () => {
      const result = await addTeamMember(teamId, member.id);
      setAddingId(null);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(`${member.full_name ?? member.email} added to team.`);
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add an existing org member to this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9"
            />
          </div>

          {/* Member list */}
          <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No members match your search." : "All org members are already on this team."}
              </p>
            ) : (
              filtered.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="size-8 shrink-0 rounded-full overflow-hidden bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <span>{memberInitials(member)}</span>
                    )}
                  </div>

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {member.full_name ?? member.email}
                    </p>
                    {member.full_name && (
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>

                  {/* Add button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    onClick={() => handleAdd(member)}
                    disabled={isPending || addingId === member.id}
                  >
                    <UserPlus className="size-3.5" />
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
