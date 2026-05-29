import type { SortOption } from "@/types/tasks";

export type TasksUrlParams = {
  filter: string;   // "all" | "my_tasks" | team_id
  sort: SortOption;
  search: string;
  page: number;
  task: number | null;
};

/**
 * Pure helper — safe to import in both server and client components.
 * Builds a /tasks URL from the current params, applying any overrides.
 * Pass null as an override value to remove that param from the URL.
 */
export function buildTasksUrl(
  current: TasksUrlParams,
  overrides: Record<string, string | null>,
): string {
  const p = new URLSearchParams();
  if (current.filter && current.filter !== "all") p.set("filter", current.filter);
  if (current.sort && current.sort !== "due_date_asc") p.set("sort", current.sort);
  if (current.search) p.set("search", current.search);
  if (current.page > 1) p.set("page", String(current.page));
  if (current.task !== null) p.set("task", String(current.task));

  for (const [k, v] of Object.entries(overrides)) {
    if (v !== null && v !== "") p.set(k, v);
    else p.delete(k);
  }

  const qs = p.toString();
  return `/tasks${qs ? `?${qs}` : ""}`;
}
