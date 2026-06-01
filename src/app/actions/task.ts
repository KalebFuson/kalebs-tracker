"use server";

import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  teamId?: string | null;
  assigneeId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
};

export type CreateTaskResult =
  | { ok: true; taskId: string }
  | { ok: false; error: string };

const NONE_MARKERS = new Set(["", "_none", "__none__"]);

function toUuidOrNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (NONE_MARKERS.has(trimmed)) {
    return null;
  }
  return trimmed;
}

function toDateOrNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

export async function createTask(
  input: CreateTaskInput,
): Promise<CreateTaskResult> {
  try {
    noStore();

    console.log("[createTask] starting");

    const title = input.title.trim();
    if (!title) {
      return { ok: false, error: "Title is required." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("[createTask] user:", user?.id ?? "NULL");

    if (userError || !user) {
      return { ok: false, error: "Not signed in." };
    }

    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error("[createTask] org lookup failed:", membershipError);
      return { ok: false, error: membershipError.message };
    }

    const orgId = membership?.org_id ?? null;
    console.log("[createTask] org_id resolved to:", orgId);

    if (!orgId) {
      return {
        ok: false,
        error: "You must belong to an organization to create tasks.",
      };
    }

    const description = input.description?.trim() || null;
    const teamId = toUuidOrNull(input.teamId);
    const assigneeId = toUuidOrNull(input.assigneeId);
    const dueDate = toDateOrNull(input.dueDate);

    console.log("[createTask] form values:", {
      title,
      description,
      status: input.status,
      priority: input.priority,
      due_date: dueDate,
      team_id: teamId,
      assignee_id: assigneeId,
    });

    try {
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          org_id: orgId,
          title,
          description,
          team_id: teamId,
          assignee_id: assigneeId,
          status: input.status,
          priority: input.priority,
          due_date: dueDate,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (taskError) {
        console.error("[createTask] insert failed:", taskError);
        return { ok: false, error: taskError.message };
      }

      if (!task?.id) {
        console.error("[createTask] insert failed: no task id returned");
        return { ok: false, error: "Task was created but no ID was returned." };
      }

      revalidatePath("/tasks");
      revalidatePath("/dashboard");

      return { ok: true, taskId: task.id };
    } catch (insertError) {
      console.error("[createTask] insert failed:", insertError);
      const message =
        insertError instanceof Error
          ? insertError.message
          : "Failed to create task.";
      return { ok: false, error: message };
    }
  } catch (error) {
    console.error("[createTask] unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { ok: false, error: message };
  }
}

export type BulkCreateResult = {
  created: number;
  failed: { title: string; error: string }[];
};

export async function createTasksFromExtraction(
  tasks: {
    title: string;
    description?: string | null;
    due_date?: string | null;
    priority: TaskPriority;
    team_id?: string | null;
    assignee_id?: string | null;
  }[],
): Promise<BulkCreateResult> {
  const result: BulkCreateResult = { created: 0, failed: [] };
  for (const t of tasks) {
    const res = await createTask({
      title: t.title,
      description: t.description ?? null,
      teamId: t.team_id ?? null,
      assigneeId: t.assignee_id ?? null,
      dueDate: t.due_date ?? null,
      status: "todo",
      priority: t.priority,
    });
    if (res.ok) {
      result.created += 1;
    } else {
      result.failed.push({ title: t.title, error: res.error });
    }
  }
  return result;
}
