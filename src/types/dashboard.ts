export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type DashboardTask = {
  id: string;
  task_number: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  team_name: string | null;
};

export type DashboardStats = {
  openTasks: number;
  overdueTasks: number;
  upcomingThisWeek: number;
};

export type DashboardTeam = {
  id: string;
  name: string;
  department: string | null;
  openTaskCount: number;
  memberCount: number;
};

export type DashboardEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  actor_name: string | null;
};
