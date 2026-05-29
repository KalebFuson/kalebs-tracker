import type { CalendarFilterState, CalendarTask, QuickView } from "@/types/calendar";
import type { TaskPriority, TaskStatus } from "@/types/tasks";

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseFilterState(searchParams: URLSearchParams): CalendarFilterState {
  const quickView = (searchParams.get("quickView") ?? "all") as QuickView;
  const status = parseList(searchParams.get("status")) as TaskStatus[];
  const priority = parseList(searchParams.get("priority")) as TaskPriority[];
  const tags = parseList(searchParams.get("tags"));
  const assignee = parseList(searchParams.get("assignee"));

  return { quickView, status, priority, tags, assignee };
}

export function applyFilters(
  tasks: CalendarTask[],
  filters: CalendarFilterState,
  currentUserId: string,
  myTeamMemberIds: string[],
): CalendarTask[] {
  let result = tasks;

  if (filters.quickView === "my_tasks") {
    result = result.filter((t) => t.assignee_id === currentUserId);
  } else if (filters.quickView === "team_tasks") {
    result = result.filter(
      (t) => t.assignee_id != null && myTeamMemberIds.includes(t.assignee_id),
    );
  }

  if (filters.status.length > 0) {
    result = result.filter((t) => filters.status.includes(t.status));
  }

  if (filters.priority.length > 0) {
    result = result.filter((t) => filters.priority.includes(t.priority));
  }

  if (filters.tags.length > 0) {
    result = result.filter((t) => t.tag_names.some((tag) => filters.tags.includes(tag)));
  }

  if (filters.assignee.length > 0) {
    result = result.filter(
      (t) => t.assignee_id != null && filters.assignee.includes(t.assignee_id),
    );
  }

  return result;
}

/** Builds a new URLSearchParams toggling one value in a multi-select key. */
export function toggleMultiParam(
  searchParams: URLSearchParams,
  key: string,
  value: string,
): URLSearchParams {
  const current = parseList(searchParams.get(key));
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  const p = new URLSearchParams(searchParams);
  if (next.length > 0) p.set(key, next.join(","));
  else p.delete(key);
  return p;
}

/** Clears all filter-related params from a URLSearchParams (keeps view and date). */
export function clearFilters(searchParams: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(searchParams);
  p.delete("quickView");
  p.delete("status");
  p.delete("priority");
  p.delete("tags");
  p.delete("assignee");
  return p;
}
