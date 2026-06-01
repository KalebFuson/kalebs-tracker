"use client";

import { useEffect, useState } from "react";

import {
  extractTasksFromText,
  type ExtractedTask,
  type ExtractResult,
} from "@/app/actions/ai";
import {
  getExtractionOptions,
  type ExtractionOptions,
} from "@/app/actions/extraction-options";
import { createTasksFromExtraction } from "@/app/actions/task";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS: { value: ExtractedTask["priority"]; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const SELECT_NONE = "";

const fieldControlClass =
  "h-9 w-full rounded-md border border-input bg-background text-sm";

type EditableExtractedTask = ExtractedTask & {
  assigneeId: string | null;
  teamId: string | null;
};

function toEditableTasks(extracted: ExtractedTask[]): EditableExtractedTask[] {
  return extracted.map((t) => ({
    ...t,
    assigneeId: null,
    teamId: null,
  }));
}

function countPersonMatches(
  hint: string,
  people: ExtractionOptions["people"],
): number {
  const h = hint.trim().toLowerCase();
  if (!h) return 0;
  return people.filter((p) => personMatchesHint(h, p.label)).length;
}

function personMatchesHint(hintLower: string, label: string): boolean {
  const labelLower = label.toLowerCase();
  if (labelLower === hintLower) return true;
  if (labelLower.includes(hintLower) || hintLower.includes(labelLower)) return true;
  const firstWord = labelLower.split(/\s+/)[0];
  if (firstWord === hintLower) return true;
  return false;
}

function findUniquePersonId(
  hint: string,
  people: ExtractionOptions["people"],
): string | null {
  const h = hint.trim().toLowerCase();
  if (!h) return null;
  const matches = people.filter((p) => personMatchesHint(h, p.label));
  if (matches.length === 1) return matches[0].id;
  return null;
}

function countTeamMatches(
  hint: string,
  teams: ExtractionOptions["teams"],
): number {
  const h = hint.trim().toLowerCase();
  if (!h) return 0;
  return teams.filter((t) => teamMatchesHint(h, t.name)).length;
}

function teamMatchesHint(hintLower: string, name: string): boolean {
  const nameLower = name.toLowerCase();
  if (nameLower === hintLower) return true;
  if (nameLower.includes(hintLower) || hintLower.includes(nameLower)) return true;
  const firstWord = nameLower.split(/\s+/)[0];
  if (firstWord === hintLower) return true;
  return false;
}

function findUniqueTeamId(
  hint: string,
  teams: ExtractionOptions["teams"],
): string | null {
  const h = hint.trim().toLowerCase();
  if (!h) return null;
  const matches = teams.filter((t) => teamMatchesHint(h, t.name));
  if (matches.length === 1) return matches[0].id;
  return null;
}

function applyHintMatching(
  tasks: EditableExtractedTask[],
  options: ExtractionOptions,
): EditableExtractedTask[] {
  return tasks.map((task) => ({
    ...task,
    assigneeId: task.assignee_hint
      ? findUniquePersonId(task.assignee_hint, options.people)
      : null,
    teamId: task.team_hint ? findUniqueTeamId(task.team_hint, options.teams) : null,
  }));
}

export function CreateFromTextModal() {
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<"idle" | "extracting" | "preview" | "error">(
    "idle",
  );
  const [tasks, setTasks] = useState<EditableExtractedTask[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [options, setOptions] = useState<ExtractionOptions | null>(null);
  const [createFeedback, setCreateFeedback] = useState<{
    created: number;
    failed: { title: string; error: string }[];
  } | null>(null);

  const hasEmptyTitle = tasks.some((t) => t.title.trim() === "");
  const optionsLoading = status === "preview" && options === null;

  useEffect(() => {
    if (!open || options) return;

    void getExtractionOptions().then((res) => {
      if (res.ok) setOptions(res.options);
    });
  }, [open, options]);

  function updateTask(index: number, patch: Partial<EditableExtractedTask>) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setRawText("");
      setStatus("idle");
      setTasks([]);
      setErrorMsg(null);
      setCreateFeedback(null);
      setOptions(null);
    }
  }

  async function loadOptionsAndMatch(base: EditableExtractedTask[]) {
    const optRes = await getExtractionOptions();
    if (optRes.ok) {
      setOptions(optRes.options);
      setTasks(applyHintMatching(base, optRes.options));
    }
  }

  async function handleExtract() {
    setStatus("extracting");
    setErrorMsg(null);
    setCreateFeedback(null);

    const result: ExtractResult = await extractTasksFromText(
      rawText,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );

    if (result.ok) {
      const base = toEditableTasks(result.tasks);
      setStatus("preview");

      if (options) {
        setTasks(applyHintMatching(base, options));
      } else {
        setTasks(base);
        await loadOptionsAndMatch(base);
      }
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
  }

  async function handleConfirm() {
    setCreating(true);
    setCreateFeedback(null);

    const result = await createTasksFromExtraction(
      tasks.map((t) => ({
        title: t.title.trim(),
        description: t.description,
        due_date: t.due_date,
        priority: t.priority,
        team_id: t.teamId,
        assignee_id: t.assigneeId,
      })),
    );

    setCreating(false);

    if (result.failed.length === 0) {
      setCreateFeedback({ created: result.created, failed: [] });
      window.setTimeout(() => handleOpenChange(false), 1500);
    } else {
      setCreateFeedback({
        created: result.created,
        failed: result.failed,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }))}>
        + Create from Text
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Create Tasks from Text</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {status !== "preview" ? (
            <div className="space-y-1.5">
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                maxLength={10000}
                rows={10}
                placeholder="Paste meeting notes, an email, or a braindump…"
                className="resize-y"
              />
              <p className="text-right text-xs text-gray-500">
                {rawText.length} / 10000
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {tasks.length} task(s) extracted — review and edit before creating.
              </p>

              {tasks.length === 0 ? (
                <p className="text-sm text-gray-600">No tasks found in this text.</p>
              ) : (
                <ul className="space-y-3">
                  {tasks.map((task, index) => {
                    const titleEmpty = task.title.trim() === "";
                    const priorityLabel =
                      PRIORITY_OPTIONS.find((o) => o.value === task.priority)?.label ??
                      task.priority;

                    const assigneeSelectValue = task.assigneeId ?? SELECT_NONE;
                    const teamSelectValue = task.teamId ?? SELECT_NONE;

                    const assigneeLabel = optionsLoading
                      ? "Loading…"
                      : assigneeSelectValue === SELECT_NONE
                        ? "Unassigned"
                        : (options?.people.find((p) => p.id === task.assigneeId)?.label ??
                          "Unassigned");

                    const teamLabel = optionsLoading
                      ? "Loading…"
                      : teamSelectValue === SELECT_NONE
                        ? "No team"
                        : (options?.teams.find((t) => t.id === task.teamId)?.name ?? "No team");

                    const assigneeMatchCount =
                      task.assignee_hint && options
                        ? countPersonMatches(task.assignee_hint, options.people)
                        : 0;
                    const teamMatchCount =
                      task.team_hint && options
                        ? countTeamMatches(task.team_hint, options.teams)
                        : 0;

                    return (
                      <li key={index}>
                        <Card className="py-0">
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                Task {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => removeTask(index)}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-1">
                              <Input
                                value={task.title}
                                onChange={(e) =>
                                  updateTask(index, { title: e.target.value })
                                }
                                placeholder="Task title"
                                aria-invalid={titleEmpty}
                                className={cn(
                                  titleEmpty && "border-red-500 focus-visible:ring-red-500/30",
                                )}
                              />
                              {titleEmpty && (
                                <p className="text-xs text-red-600">Title required</p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor={`due-date-${index}`}>Due date</Label>
                              <input
                                id={`due-date-${index}`}
                                type="date"
                                value={task.due_date ?? ""}
                                onChange={(e) =>
                                  updateTask(index, {
                                    due_date: e.target.value || null,
                                  })
                                }
                                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label>Priority</Label>
                              <Select
                                value={task.priority}
                                onValueChange={(value) => {
                                  if (value !== null) {
                                    updateTask(index, {
                                      priority: value as ExtractedTask["priority"],
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue>{priorityLabel}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {PRIORITY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label>Assignee</Label>
                              <Select
                                value={assigneeSelectValue}
                                onValueChange={(value) => {
                                  if (value !== null) {
                                    updateTask(index, {
                                      assigneeId: value === SELECT_NONE ? null : value,
                                    });
                                  }
                                }}
                                disabled={optionsLoading}
                              >
                                <SelectTrigger className={fieldControlClass}>
                                  <SelectValue>{assigneeLabel}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={SELECT_NONE}>Unassigned</SelectItem>
                                  {options?.people.map((person) => (
                                    <SelectItem key={person.id} value={person.id}>
                                      {person.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {task.assignee_hint &&
                                (assigneeMatchCount !== 1 ? (
                                  <p className="text-xs text-amber-700">
                                    Suggested: {task.assignee_hint} (no match — select
                                    manually)
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Suggested: {task.assignee_hint}
                                  </p>
                                ))}
                            </div>

                            <div className="space-y-1.5">
                              <Label>Team</Label>
                              <Select
                                value={teamSelectValue}
                                onValueChange={(value) => {
                                  if (value !== null) {
                                    updateTask(index, {
                                      teamId: value === SELECT_NONE ? null : value,
                                    });
                                  }
                                }}
                                disabled={optionsLoading}
                              >
                                <SelectTrigger className={fieldControlClass}>
                                  <SelectValue>{teamLabel}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={SELECT_NONE}>No team</SelectItem>
                                  {options?.teams.map((team) => (
                                    <SelectItem key={team.id} value={team.id}>
                                      {team.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {task.team_hint &&
                                (teamMatchCount !== 1 ? (
                                  <p className="text-xs text-amber-700">
                                    Suggested: {task.team_hint} (no match — select manually)
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Suggested: {task.team_hint}
                                  </p>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-border px-6 py-4">
          {status === "extracting" && (
            <p className="text-sm text-gray-600">Extracting…</p>
          )}

          {status === "error" && errorMsg && (
            <p className="text-sm font-medium text-red-600">{errorMsg}</p>
          )}

          {status !== "preview" ? (
            <Button
              type="button"
              onClick={() => void handleExtract()}
              disabled={status === "extracting" || rawText.trim() === ""}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Extract
            </Button>
          ) : (
            <>
              {createFeedback && (
                <div className="space-y-1 text-sm">
                  {createFeedback.failed.length === 0 ? (
                    <p className="font-medium text-emerald-700">
                      Created {createFeedback.created} task(s)
                    </p>
                  ) : (
                    <>
                      <p className="font-medium text-amber-800">
                        Created {createFeedback.created},{" "}
                        {createFeedback.failed.length} failed
                      </p>
                      <ul className="list-inside list-disc text-red-600">
                        {createFeedback.failed.map((f) => (
                          <li key={`${f.title}-${f.error}`}>
                            {f.title}: {f.error}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
              <Button
                type="button"
                disabled={creating || tasks.length === 0 || hasEmptyTitle}
                onClick={() => void handleConfirm()}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {creating ? "Creating…" : `Confirm & Create (${tasks.length})`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
