"use client";

import { Search, UserMinus } from "lucide-react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/actions/update-task";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { OrgMember } from "@/types/tasks";

type AssigneeState = {
  id: string | null;
  name: string | null;
  email: string | null;
};

function initials(name: string | null, email: string | null): string {
  const source = name ?? email ?? "?";
  if (source.includes("@")) return source[0].toUpperCase();
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function memberDisplayName(m: OrgMember): string {
  return m.full_name?.trim() || m.email;
}

type EditableAssigneeProps = {
  taskId: string;
  currentAssigneeId: string | null;
  orgMembers: OrgMember[];
  currentUserId: string;
};

export function EditableAssignee({
  taskId,
  currentAssigneeId,
  orgMembers,
  currentUserId,
}: EditableAssigneeProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const currentMember = orgMembers.find((m) => m.id === currentAssigneeId) ?? null;
  const [optimisticAssignee, setOptimisticAssignee] = useOptimistic<AssigneeState>({
    id: currentAssigneeId,
    name: currentMember?.full_name ?? null,
    email: currentMember?.email ?? null,
  });

  function handleOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSearch("");
      // autofocus the search input after the popover opens
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }

  function handleSelect(member: OrgMember | null) {
    const newId = member?.id ?? null;
    if (newId === optimisticAssignee.id) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      setOptimisticAssignee({
        id: newId,
        name: member?.full_name ?? null,
        email: member?.email ?? null,
      });
      const result = await updateTask({ taskId, updates: { assignee_id: newId } });
      if (!result.ok) toast.error(`Failed to update assignee: ${result.error}`);
    });
  }

  const filtered = search.trim()
    ? orgMembers.filter((m) =>
        memberDisplayName(m).toLowerCase().includes(search.toLowerCase()),
      )
    : orgMembers;

  const isAssignedToMe = optimisticAssignee.id === currentUserId;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition-colors hover:bg-gray-100",
            isPending && "opacity-60",
          )}
        >
          {optimisticAssignee.id ? (
            <>
              <div className="size-6 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                {initials(optimisticAssignee.name, optimisticAssignee.email)}
              </div>
              <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                {optimisticAssignee.name ?? optimisticAssignee.email}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Unassigned</span>
          )}
        </PopoverTrigger>

        <PopoverContent className="w-60 p-1" align="start">
          {/* Search */}
          <div className="relative mb-1 px-1">
            <Search className="absolute left-3 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full rounded border border-input bg-background py-1.5 pl-7 pr-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick "Assign to me" */}
          {!isAssignedToMe && (
            <button
              onClick={() =>
                handleSelect(orgMembers.find((m) => m.id === currentUserId) ?? null)
              }
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50"
            >
              Assign to me
            </button>
          )}

          {/* Members list */}
          <ul className="max-h-48 overflow-y-auto">
            {filtered.map((member) => (
              <li key={member.id}>
                <button
                  onClick={() => handleSelect(member)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-100",
                    member.id === optimisticAssignee.id && "font-semibold",
                  )}
                >
                  <div className="size-6 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                    {initials(member.full_name, member.email)}
                  </div>
                  <span className="truncate">{memberDisplayName(member)}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Unassign */}
          {optimisticAssignee.id && (
            <button
              onClick={() => handleSelect(null)}
              className="mt-1 flex w-full items-center gap-2 rounded border-t border-border px-2 py-1.5 text-sm text-muted-foreground hover:bg-gray-50 hover:text-red-600"
            >
              <UserMinus className="size-3.5" />
              Unassign
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
