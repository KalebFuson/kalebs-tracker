import { Tag } from "lucide-react";

import { EditableAssignee } from "@/components/tasks/editable/EditableAssignee";
import { EditableDueDate } from "@/components/tasks/editable/EditableDueDate";
import { EditablePriority } from "@/components/tasks/editable/EditablePriority";
import { EditableStatus } from "@/components/tasks/editable/EditableStatus";
import type { OrgMember, TaskPriority, TaskStatus } from "@/types/tasks";

type MetaRowProps = {
  label: string;
  children: React.ReactNode;
};

function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </div>
  );
}

type TaskDetailMetadataProps = {
  taskId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  tag_names: string[];
  orgMembers: OrgMember[];
  currentUserId: string;
};

export function TaskDetailMetadata({
  taskId,
  status,
  priority,
  assignee_id,
  due_date,
  tag_names,
  orgMembers,
  currentUserId,
}: TaskDetailMetadataProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Details
      </p>
      <div className="space-y-3 rounded-xl border border-border bg-white p-4">
        <MetaRow label="Status">
          <EditableStatus taskId={taskId} currentStatus={status} />
        </MetaRow>

        <MetaRow label="Assignee">
          <EditableAssignee
            taskId={taskId}
            currentAssigneeId={assignee_id}
            orgMembers={orgMembers}
            currentUserId={currentUserId}
          />
        </MetaRow>

        <MetaRow label="Due Date">
          <EditableDueDate taskId={taskId} currentDueDate={due_date} />
        </MetaRow>

        <MetaRow label="Priority">
          <EditablePriority taskId={taskId} currentPriority={priority} />
        </MetaRow>

        {tag_names.length > 0 && (
          <MetaRow label="Tags">
            <div className="flex flex-wrap justify-end gap-1">
              {tag_names.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                >
                  <Tag className="mr-1 inline size-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </MetaRow>
        )}
      </div>
    </div>
  );
}
