import { format } from "date-fns";

import type { ActivityMetadata, TaskActivity, TaskStatus } from "@/types/tasks";

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return format(new Date(isoString), "MMM d");
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

function statusLabel(value: string | null | undefined): string {
  return value ? (STATUS_LABEL[value as TaskStatus] ?? value) : "—";
}

function priorityLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "none";
  try {
    return format(new Date(value + "T00:00:00"), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function formatActionSentence(action: string, metadata: ActivityMetadata | null): string {
  const m = metadata ?? {};
  switch (action) {
    case "status_changed":
      return `changed status from ${statusLabel(m.from)} to ${statusLabel(m.to)}`;
    case "priority_changed":
      return `set priority to ${priorityLabel(m.to)}`;
    case "due_date_changed":
      if (!m.to) return "cleared the due date";
      return `set due date to ${formatDate(m.to)}`;
    case "assignee_changed":
      if (!m.to_id) return "unassigned the task";
      if (m.to_name) return `assigned task to ${m.to_name}`;
      return "changed the assignee";
    case "title_changed":
      return "edited the title";
    case "description_changed":
      return "edited the description";
    case "created":
      return "created this task";
    default:
      return action.replace(/_/g, " ");
  }
}

type TaskActivityFeedProps = {
  activity: TaskActivity[];
};

export function TaskActivityFeed({ activity }: TaskActivityFeedProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Activity
      </p>

      {activity.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          No activity yet. Edit a field to start the activity log.
        </p>
      ) : (
        <ul className="space-y-4">
          {activity.map((item) => {
            const initials = (item.actor_name ?? "?")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <li key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">
                      {item.actor_name ?? "Someone"}
                    </span>{" "}
                    {formatActionSentence(item.action, item.metadata)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeTime(item.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
