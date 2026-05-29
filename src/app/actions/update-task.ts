"use server";

import { unstable_noStore as noStore, revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type UpdateTaskUpdates = {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  assignee_id?: string | null;
};

type UpdateTaskInput = {
  taskId: string;
  updates: UpdateTaskUpdates;
};

type UpdateTaskResult = { ok: true } | { ok: false; error: string };

export async function updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
  try {
    noStore();

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return { ok: false, error: "Not signed in." };

    // Fetch current task to get org_id and old field values for event metadata
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("id, org_id, title, description, status, priority, due_date, assignee_id")
      .eq("id", input.taskId)
      .single();
    if (fetchError || !task) return { ok: false, error: "Task not found." };

    // Build clean update object — only include keys explicitly present in updates
    const cleanUpdates: Record<string, unknown> = {};
    const u = input.updates;
    if (u.title !== undefined) cleanUpdates.title = u.title;
    if ("description" in u) cleanUpdates.description = u.description ?? null;
    if (u.status !== undefined) cleanUpdates.status = u.status;
    if (u.priority !== undefined) cleanUpdates.priority = u.priority;
    if ("due_date" in u) cleanUpdates.due_date = u.due_date ?? null;
    if ("assignee_id" in u) cleanUpdates.assignee_id = u.assignee_id ?? null;

    if (Object.keys(cleanUpdates).length === 0) return { ok: true };

    const { error: updateError } = await supabase
      .from("tasks")
      .update(cleanUpdates)
      .eq("id", input.taskId);
    if (updateError) return { ok: false, error: updateError.message };

    // Build one event per changed field
    type EventInsert = {
      org_id: string;
      actor_id: string;
      entity_type: "task";
      entity_id: string;
      action: string;
      metadata: Record<string, unknown>;
    };
    const base = {
      org_id: task.org_id as string,
      actor_id: user.id,
      entity_type: "task" as const,
      entity_id: task.id as string,
    };
    const events: EventInsert[] = [];

    if (cleanUpdates.status !== undefined && cleanUpdates.status !== task.status) {
      events.push({ ...base, action: "status_changed", metadata: { from: task.status, to: cleanUpdates.status } });
    }
    if (cleanUpdates.priority !== undefined && cleanUpdates.priority !== task.priority) {
      events.push({ ...base, action: "priority_changed", metadata: { from: task.priority, to: cleanUpdates.priority } });
    }
    if ("due_date" in cleanUpdates && cleanUpdates.due_date !== task.due_date) {
      events.push({ ...base, action: "due_date_changed", metadata: { from: task.due_date, to: cleanUpdates.due_date } });
    }
    if ("assignee_id" in cleanUpdates && cleanUpdates.assignee_id !== task.assignee_id) {
      // Resolve display names for both old and new assignee
      let from_name: string | null = null;
      let to_name: string | null = null;
      const idsToFetch = [task.assignee_id, cleanUpdates.assignee_id].filter(
        (id): id is string => typeof id === "string" && id !== "",
      );
      if (idsToFetch.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", idsToFetch);
        const pm = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
        if (task.assignee_id) from_name = pm[task.assignee_id]?.full_name ?? pm[task.assignee_id]?.email ?? null;
        if (cleanUpdates.assignee_id) {
          const aid = cleanUpdates.assignee_id as string;
          to_name = pm[aid]?.full_name ?? pm[aid]?.email ?? null;
        }
      }
      events.push({
        ...base,
        action: "assignee_changed",
        metadata: { from_id: task.assignee_id, to_id: cleanUpdates.assignee_id, from_name, to_name },
      });
    }
    if (cleanUpdates.title !== undefined && cleanUpdates.title !== task.title) {
      events.push({ ...base, action: "title_changed", metadata: {} });
    }
    if ("description" in cleanUpdates && cleanUpdates.description !== task.description) {
      events.push({ ...base, action: "description_changed", metadata: {} });
    }

    if (events.length > 0) {
      await supabase.from("events").insert(events);
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { ok: false, error: message };
  }
}
