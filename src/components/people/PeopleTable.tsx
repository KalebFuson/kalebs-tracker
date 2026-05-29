"use client";

import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OrgMemberWithProfile, PendingInvitation } from "@/types/people";
import type { OrgTeam } from "@/types/teams";
import { InviteMembersDialog } from "@/components/teams/InviteMembersDialog";

import { PeopleMemberRow } from "./PeopleMemberRow";
import { PendingInvitationsList } from "./PendingInvitationsList";

type Tab = "members" | "pending";
type RoleFilter = "all" | "admin" | "member";

type PeopleTableProps = {
  members: OrgMemberWithProfile[];
  pendingInvitations: PendingInvitation[];
  orgTeams: OrgTeam[];
  currentUserId: string;
  isAdmin: boolean;
};

export function PeopleTable({
  members,
  pendingInvitations,
  orgTeams,
  currentUserId,
  isAdmin,
}: PeopleTableProps) {
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const q = search.toLowerCase().trim();

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !q ||
      (m.full_name?.toLowerCase().includes(q) ?? false) ||
      m.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredPending = pendingInvitations.filter(
    (inv) => !q || inv.email.toLowerCase().includes(q),
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">People</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage who has access to your organization.
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="shrink-0 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="size-3.5" />
            Invite New Members
          </Button>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        {/* Search row */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-white">
          {(
            [
              { id: "members", label: `Members (${members.length})` },
              ...(isAdmin
                ? [{ id: "pending", label: `Pending (${pendingInvitations.length})` }]
                : []),
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                t.id === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {t.label}
            </button>
          ))}

          {/* Role filter chips — only on Members tab */}
          {tab === "members" && (
            <div className="ml-auto flex items-center gap-1 px-4">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "admin", label: "Admins" },
                  { id: "member", label: "Members" },
                ] as { id: RoleFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRoleFilter(f.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    roleFilter === f.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {tab === "members" ? (
          filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="size-8 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">
                {q ? `No members match "${search}"` : "No members yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="py-2.5 pl-4 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Member
                    </th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Role
                    </th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Teams
                    </th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Joined
                    </th>
                    <th className="py-2.5 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <PeopleMemberRow
                      key={m.id}
                      member={m}
                      isAdmin={isAdmin}
                      isCurrentUser={m.user_id === currentUserId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <PendingInvitationsList invitations={filteredPending} />
        )}
      </Card>

      {isAdmin && (
        <InviteMembersDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          orgTeams={orgTeams}
        />
      )}
    </div>
  );
}
