"use client";

import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { clearFilters, parseFilterState, toggleMultiParam } from "@/lib/calendar/filters";
import { cn } from "@/lib/utils";
import type { OrgTag, QuickView } from "@/types/calendar";
import type { OrgMember, TaskPriority, TaskStatus } from "@/types/tasks";

const STATUS_OPTIONS: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "todo", label: "To Do", dot: "bg-gray-400" },
  { value: "in_progress", label: "In Progress", dot: "bg-blue-500" },
  { value: "in_review", label: "In Review", dot: "bg-purple-500" },
  { value: "done", label: "Done", dot: "bg-green-500" },
  { value: "blocked", label: "Blocked", dot: "bg-red-500" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: "urgent", label: "Urgent", dot: "bg-red-500" },
  { value: "high", label: "High", dot: "bg-orange-500" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "low", label: "Low", dot: "bg-gray-400" },
];

const QUICK_VIEWS: { value: QuickView; label: string }[] = [
  { value: "all", label: "All company tasks" },
  { value: "my_tasks", label: "My tasks" },
  { value: "team_tasks", label: "Team tasks" },
];

type SectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-gray-700"
      >
        {title}
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="mt-2 px-4">{children}</div>}
    </div>
  );
}

type FilterSidebarProps = {
  orgMembers: OrgMember[];
  orgTags: OrgTag[];
  currentUserId: string;
};

export function FilterSidebar({ orgMembers, orgTags, currentUserId }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterState = parseFilterState(searchParams);

  const hasActiveFilters =
    filterState.quickView !== "all" ||
    filterState.status.length > 0 ||
    filterState.priority.length > 0 ||
    filterState.tags.length > 0 ||
    filterState.assignee.length > 0;

  function pushUrl(p: URLSearchParams) {
    router.push(`/calendar?${p.toString()}`);
  }

  function setQuickView(value: QuickView) {
    const p = new URLSearchParams(searchParams);
    if (value === "all") p.delete("quickView");
    else p.set("quickView", value);
    pushUrl(p);
  }

  function toggleStatus(value: TaskStatus) {
    pushUrl(toggleMultiParam(searchParams, "status", value));
  }

  function togglePriority(value: TaskPriority) {
    pushUrl(toggleMultiParam(searchParams, "priority", value));
  }

  function toggleTag(name: string) {
    pushUrl(toggleMultiParam(searchParams, "tags", name));
  }

  function toggleAssignee(id: string) {
    pushUrl(toggleMultiParam(searchParams, "assignee", id));
  }

  function handleClearAll() {
    pushUrl(clearFilters(searchParams));
  }

  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-y-auto border-r border-border bg-white">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-gray-700">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Quick Views */}
      <Section title="Quick Views">
        <div className="space-y-1">
          {QUICK_VIEWS.map((qv) => {
            const isActive = filterState.quickView === qv.value;
            return (
              <label
                key={qv.value}
                className="flex cursor-pointer items-center gap-2.5 rounded py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <input
                  type="radio"
                  name="quickView"
                  value={qv.value}
                  checked={isActive}
                  onChange={() => setQuickView(qv.value)}
                  className="accent-indigo-600"
                />
                {qv.label}
              </label>
            );
          })}
        </div>
      </Section>

      {/* Status */}
      <Section title="Status">
        <div className="space-y-1">
          {STATUS_OPTIONS.map((opt) => {
            const isChecked = filterState.status.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 rounded py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStatus(opt.value)}
                  className="rounded accent-indigo-600"
                />
                <span className={cn("size-2 shrink-0 rounded-full", opt.dot)} />
                {opt.label}
              </label>
            );
          })}
        </div>
      </Section>

      {/* Priority */}
      <Section title="Priority">
        <div className="space-y-1">
          {PRIORITY_OPTIONS.map((opt) => {
            const isChecked = filterState.priority.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 rounded py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePriority(opt.value)}
                  className="rounded accent-indigo-600"
                />
                <span className={cn("size-2 shrink-0 rounded-full", opt.dot)} />
                {opt.label}
              </label>
            );
          })}
        </div>
      </Section>

      {/* Tags */}
      {orgTags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {orgTags.map((tag) => {
              const isActive = filterState.tags.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
                    isActive
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-border bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600",
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Assignee */}
      {orgMembers.length > 0 && (
        <Section title="Assignee">
          <div className="space-y-1">
            {orgMembers.map((member) => {
              const isChecked = filterState.assignee.includes(member.id);
              const name = member.full_name ?? member.email;
              const isMe = member.id === currentUserId;
              return (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded py-1 text-sm text-gray-700 hover:text-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAssignee(member.id)}
                    className="rounded accent-indigo-600"
                  />
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatar_url}
                      alt={name}
                      className="size-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-5 items-center justify-center rounded-full bg-indigo-200 text-[9px] font-bold text-indigo-700 shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate">
                    {name}
                    {isMe && (
                      <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </Section>
      )}
    </aside>
  );
}
