import type { TaskPriority, TaskStatus } from "@/app/actions/task";

/** Pill/badge background+text for each priority */
export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-stone-200 text-stone-600",
};

/** Solid dot color for each priority */
export const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-stone-400",
};

/** Pill/badge background+text for each status */
export const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: "bg-stone-200 text-stone-700",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-violet-100 text-violet-700",
  done: "bg-emerald-100 text-emerald-800",
  blocked: "bg-red-100 text-red-700",
};

/** Solid dot color for each status */
export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: "bg-stone-400",
  in_progress: "bg-blue-500",
  in_review: "bg-violet-500",
  done: "bg-emerald-500",
  blocked: "bg-red-500",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};
