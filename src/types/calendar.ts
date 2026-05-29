import type { TaskListItem, TaskPriority, TaskStatus } from "@/types/tasks";

export type CalendarView = "month" | "week" | "day";

export type QuickView = "all" | "my_tasks" | "team_tasks";

export type CalendarFilterState = {
  quickView: QuickView;
  status: TaskStatus[];
  priority: TaskPriority[];
  tags: string[];
  assignee: string[];
};

export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

export type OrgTag = {
  id: string;
  name: string;
};

export type CalendarTask = TaskListItem;
