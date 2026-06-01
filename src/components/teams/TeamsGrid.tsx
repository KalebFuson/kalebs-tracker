"use client";

import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TeamListItem } from "@/types/teams";

import { CreateTeamDialog } from "./CreateTeamDialog";
import { TeamCard } from "./TeamCard";

type TeamsGridProps = {
  teams: TeamListItem[];
};

export function TeamsGrid({ teams }: TeamsGridProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = teams.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.department?.toLowerCase().includes(q) ?? false) ||
      (t.description?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage organization structure and cross-team collaboration.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Search + view toggle row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name or department..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-gray-100">
            <Users className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {search ? "No teams match your search" : "No teams yet"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : 'Create your first team by clicking "+ Create Team".'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
