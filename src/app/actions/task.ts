"use server";

import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const optionalUuidField = z.union([
  z.string().uuid(),
  z.literal(""),
  z.literal("_none"),
  z.literal("__none__"),
  z.null(),
  z.undefined(),
]);

const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(500, "Title too long."),
  description: z.string().trim().max(5000).nullish(),
  teamId: optionalUuidField,
  assigneeId: optionalUuidField,
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format.")
    .nullish(),
});

const bulkExtractionSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(500),
        description: z.string().trim().max(5000).nullish(),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        team_id: z.string().uuid().nullish(),
        assignee_id: z.string().uuid().nullish(),
      }),
    )
    .min(1, "No tasks provided.")
    .max(50, "Too many tasks in one request (max 50)."),
});

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
    const parsed = taskInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid task input.",
      };
    }

    noStore();

    console.log("[createTask] starting");

    const title = parsed.data.title.trim();

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

    const description = parsed.data.description?.trim() || null;
    const teamId = toUuidOrNull(parsed.data.teamId);
    const assigneeId = toUuidOrNull(parsed.data.assigneeId);
    const dueDate = toDateOrNull(parsed.data.dueDate);

    console.log("[createTask] form values:", {
      title,
      description,
      status: parsed.data.status,
      priority: parsed.data.priority,
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
          status: parsed.data.status,
          priority: parsed.data.priority,
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
  const parsed = bulkExtractionSchema.safeParse({ tasks });
  if (!parsed.success) {
    return {
      created: 0,
      failed: [
        {
          title: "(validation)",
          error: parsed.error.issues[0]?.message ?? "Invalid input.",
        },
      ],
    };
  }

  const result: BulkCreateResult = { created: 0, failed: [] };
  for (const t of parsed.data.tasks) {
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
