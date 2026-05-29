"use server";

import { getTaskByNumber } from "@/lib/tasks/queries";
import type { TaskDetail } from "@/types/tasks";

/**
 * Server action that fetches a single task for the global task detail sheet.
 * Called from GlobalTaskSheet (client component) whenever ?task= changes.
 * RLS on the tasks table ensures the calling user can only see tasks in their org.
 */
export async function fetchTaskDetail(
  orgId: string,
  taskNumber: number,
): Promise<TaskDetail | null> {
  return getTaskByNumber(orgId, taskNumber);
}
