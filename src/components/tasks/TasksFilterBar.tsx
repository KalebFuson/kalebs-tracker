"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildTasksUrl, type TasksUrlParams } from "@/lib/tasks/build-url";
import { cn } from "@/lib/utils";
import type { SortOption, TeamFilterOption } from "@/types/tasks";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "due_date_asc", label: "Due Date (Asc)" },
  { value: "due_date_desc", label: "Due Date (Desc)" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
  { value: "created_at", label: "Created At" },
];

type TasksFilterBarProps = {
  teams: TeamFilterOption[];
  urlParams: TasksUrlParams;
};

export function TasksFilterBar({ teams, urlParams }: TasksFilterBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState(urlParams.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when URL-driven search changes (e.g. browser back/forward)
  useEffect(() => {
    setSearch(urlParams.search);
  }, [urlParams.search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildTasksUrl(urlParams, { search: value || null, page: null }));
    }, 350);
  }

  function handleSortChange(value: string | null) {
    if (!value) return;
    router.push(buildTasksUrl(urlParams, { sort: value, page: null }));
  }

  const chips = [
    { label: "All Tasks", value: "all" },
    { label: "My Tasks", value: "my_tasks" },
    ...teams.map((t) => ({ label: t.name, value: t.id })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => {
          const isActive = urlParams.filter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() =>
                router.push(
                  buildTasksUrl(urlParams, {
                    filter: chip.value === "all" ? null : chip.value,
                    page: null,
                  }),
                )
              }
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={urlParams.sort} onValueChange={handleSortChange}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
