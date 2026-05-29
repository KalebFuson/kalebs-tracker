"use client";

import { format } from "date-fns";
import {
  CalendarIcon,
  CircleDot,
  Flag,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  createTask,
  type CreateTaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/app/actions/task";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Internal select marker — never shown in the UI. */
const SELECT_NONE = "_none";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const fieldControlClass =
  "h-9 w-full rounded-md border border-input bg-background text-sm";

type TeamOption = {
  id: string;
  name: string;
};

type AssigneeOption = {
  id: string;
  label: string;
};

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selects this team when the dialog opens (e.g. from team detail page) */
  defaultTeamId?: string | null;
};

type CreateTaskFormState = {
  title: string;
  description: string;
  teamId: string | null;
  assigneeId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | undefined;
};

const initialFormState: CreateTaskFormState = {
  title: "",
  description: "",
  teamId: null,
  assigneeId: null,
  status: "todo",
  priority: "medium",
  dueDate: undefined,
};

function getStatusLabel(status: TaskStatus): string {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "To Do"
  );
}

function getPriorityLabel(priority: TaskPriority): string {
  return (
    PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ??
    "Medium"
  );
}

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      <Icon className="size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultTeamId,
}: CreateTaskDialogProps) {
  const [form, setForm] = useState<CreateTaskFormState>({
    ...initialFormState,
    teamId: defaultTeamId ?? null,
  });
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormError(null);
    setTitleError(null);

    async function loadOptions() {
      setIsLoadingOptions(true);
      const supabase = createClient();

      // Get current user and org membership user_ids in parallel.
      // NOTE: We deliberately do NOT join profiles from org_members here because
      // org_members.user_id → auth.users (no direct FK to profiles), so
      // PostgREST returns null for every profiles row and they all get filtered.
      // Instead we fetch profiles separately with .in("id", userIds).
      const [
        { data: { user } },
        teamsResult,
        membersResult,
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("teams").select("id, name").order("name"),
        supabase.from("org_members").select("user_id").order("created_at"),
      ]);

      const currentUserId = user?.id ?? null;

      if (teamsResult.data) {
        setTeams(teamsResult.data);
      }

      const userIds = (membersResult.data ?? []).map((m) => m.user_id);

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const options: AssigneeOption[] = (profilesData ?? []).map((profile) => {
          const isMe = profile.id === currentUserId;
          const name = profile.full_name?.trim() || profile.email;
          return {
            id: profile.id,
            label: isMe ? `${name} (you)` : name,
          };
        });

        // Current user first, then everyone else alphabetically.
        options.sort((a, b) => {
          const aIsMe = a.id === currentUserId;
          const bIsMe = b.id === currentUserId;
          if (aIsMe) return -1;
          if (bIsMe) return 1;
          return a.label.localeCompare(b.label);
        });

        setAssignees(options);
      }

      // Pre-select the current user so tasks are assigned to self by default.
      // Also apply defaultTeamId each time the dialog opens.
      setForm((prev) => ({
        ...prev,
        assigneeId: currentUserId ?? prev.assigneeId,
        teamId: defaultTeamId ?? prev.teamId,
      }));

      setIsLoadingOptions(false);
    }

    void loadOptions();
  }, [open, defaultTeamId]);

  function resetForm() {
    setForm({ ...initialFormState, teamId: defaultTeamId ?? null });
    setTitleError(null);
    setFormError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setTitleError("Title is required.");
      return;
    }

    setTitleError(null);

    const payload: CreateTaskInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      teamId: form.teamId,
      assigneeId: form.assigneeId,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? format(form.dueDate, "yyyy-MM-dd") : null,
    };

    startTransition(async () => {
      try {
        const result = await createTask(payload);

        if (!result.ok) {
          setFormError(result.error);
          return;
        }

        resetForm();
        onOpenChange(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.";
        setFormError(message);
      }
    });
  }

  const isDisabled = isPending || isLoadingOptions;

  const assigneeLabel =
    form.assigneeId === null
      ? "Unassigned"
      : (assignees.find((a) => a.id === form.assigneeId)?.label ?? "Unassigned");

  const teamLabel =
    form.teamId === null
      ? "No team"
      : (teams.find((t) => t.id === form.teamId)?.name ?? "No team");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,800px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="space-y-1 border-b border-border px-6 py-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Create Task
          </DialogTitle>
          <DialogDescription>
            Add a new task to your team
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-4 px-6 py-4">
            {formError ? (
              <p
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Input
                autoFocus
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Task title"
                disabled={isDisabled}
                aria-invalid={Boolean(titleError)}
                aria-label="Task title"
                className={cn(fieldControlClass, "h-10 text-base font-medium")}
              />
              {titleError ? (
                <p className="text-sm text-red-600" role="alert">
                  {titleError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Add a description..."
                rows={4}
                disabled={isDisabled}
                aria-label="Description"
                className="min-h-[96px] resize-none rounded-md text-sm"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <FieldLabel icon={User}>Assignee</FieldLabel>
                <Select
                  value={form.assigneeId ?? SELECT_NONE}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      assigneeId: value === SELECT_NONE ? null : value,
                    }))
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger className={fieldControlClass}>
                    <SelectValue>{assigneeLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>Unassigned</SelectItem>
                    {assignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {assignee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel icon={Users}>Team</FieldLabel>
                <Select
                  value={form.teamId ?? SELECT_NONE}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      teamId: value === SELECT_NONE ? null : value,
                    }))
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger className={fieldControlClass}>
                    <SelectValue>{teamLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel icon={CalendarIcon}>Due Date</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isDisabled}
                        className={cn(
                          fieldControlClass,
                          "justify-start px-2.5 font-normal shadow-none",
                          !form.dueDate && "text-muted-foreground",
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="size-3.5 shrink-0 text-indigo-600" />
                    <span className="truncate">
                      {form.dueDate
                        ? format(form.dueDate, "MMM d, yyyy")
                        : "Pick a date"}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.dueDate}
                      onSelect={(date) =>
                        setForm((prev) => ({ ...prev, dueDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <FieldLabel icon={CircleDot}>Status</FieldLabel>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      status: value as TaskStatus,
                    }))
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger className={fieldControlClass}>
                    <SelectValue>{getStatusLabel(form.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel icon={Flag}>Priority</FieldLabel>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: value as TaskPriority,
                    }))
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger className={fieldControlClass}>
                    <SelectValue>{getPriorityLabel(form.priority)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-auto flex-row items-center justify-between gap-3 border-t border-border px-6 py-3 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={isDisabled}
            >
              {isPending ? "Creating…" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
