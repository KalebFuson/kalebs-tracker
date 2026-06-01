import { Plus } from "lucide-react";

import type { TaskSubtask } from "@/types/tasks";

type TaskDetailSubtasksProps = {
  subtasks: TaskSubtask[];
  completedCount: number;
};

export function TaskDetailSubtasks({ subtasks, completedCount }: TaskDetailSubtasksProps) {
  const total = subtasks.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div>
      {/* Header row with label + count */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subtasks
        </p>
        <span className="text-xs font-medium text-muted-foreground">
          {total > 0 ? `${completedCount} / ${total}` : "0"}
        </span>
      </div>

      {/* Progress bar — only when there are subtasks */}
      {total > 0 && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="rounded-xl border border-border bg-white">
        {total === 0 ? (
          <p className="px-4 py-3.5 text-sm text-muted-foreground">
            No subtasks yet. Add one below.
          </p>
        ) : (
          <ul>
            {subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
              >
                {/* Read-only checkbox */}
                <div
                  className={`flex size-4 shrink-0 items-center justify-center rounded border-2 ${
                    subtask.is_completed
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {subtask.is_completed && (
                    <svg className="size-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1.5 5L4 7.5L8.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-sm ${subtask.is_completed ? "text-muted-foreground line-through" : "text-gray-800"}`}
                >
                  {subtask.title}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Add subtask action */}
        <button
          onClick={() => console.log("Add subtask — not implemented yet")}
          className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
        >
          <Plus className="size-3.5" />
          Add Subtask
        </button>
      </div>
    </div>
  );
}
