export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskSubtask = {
  id: string;
  title: string;
  is_completed: boolean;
  position: number;
};

export type ActivityMetadata = {
  from?: string | null;
  to?: string | null;
  from_id?: string | null;
  to_id?: string | null;
  from_name?: string | null;
  to_name?: string | null;
};

export type TaskActivity = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  actor_name: string | null;
  actor_avatar: string | null;
  metadata: ActivityMetadata | null;
};

export type TaskListItem = {
  id: string;
  task_number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  team_id: string | null;
  team_name: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_avatar: string | null;
  tag_names: string[];
  subtask_count: number;
  completed_subtask_count: number;
};

export type TaskDetail = TaskListItem & {
  subtasks: TaskSubtask[];
  activity: TaskActivity[];
};

export type SortOption =
  | "due_date_asc"
  | "due_date_desc"
  | "priority"
  | "status"
  | "created_at";

export type TasksQueryOpts = {
  filter?: string; // "all" | "my_tasks" | <team_id uuid>
  sort?: SortOption;
  page?: number;
  search?: string;
  pageSize?: number;
};

export type TasksQueryResult = {
  tasks: TaskListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type TeamFilterOption = {
  id: string;
  name: string;
};

export type OrgMember = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};
