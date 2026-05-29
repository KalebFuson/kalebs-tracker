"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { fetchTaskDetail } from "@/app/actions/get-task";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import type { OrgMember, TaskDetail } from "@/types/tasks";

type GlobalTaskSheetProps = {
  orgId: string;
  orgSlug: string;
  orgMembers: OrgMember[];
  currentUserId: string;
};

/**
 * Mounted once in the app shell layout so every page gets the task side panel.
 * Reads ?task= from the URL, fetches the task via a server action, and renders
 * TaskDetailSheet. The close href strips ?task= while preserving the current
 * pathname and all other search params.
 */
export function GlobalTaskSheet({
  orgId,
  orgSlug,
  orgMembers,
  currentUserId,
}: GlobalTaskSheetProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const taskParam = searchParams.get("task");
  const taskNumber = taskParam ? parseInt(taskParam, 10) : null;

  const [task, setTask] = useState<TaskDetail | null>(null);

  // Build closeHref: same pathname + params minus ?task=
  const closeHref = (() => {
    const p = new URLSearchParams(searchParams);
    p.delete("task");
    const qs = p.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  })();

  useEffect(() => {
    if (taskNumber === null || isNaN(taskNumber)) {
      setTask(null);
      return;
    }

    let cancelled = false;

    fetchTaskDetail(orgId, taskNumber).then((result) => {
      if (!cancelled) setTask(result);
    });

    return () => {
      cancelled = true;
    };
  }, [orgId, taskNumber]);

  return (
    <TaskDetailSheet
      // When the task param is absent, pass null so the sheet closes immediately.
      task={taskNumber !== null ? task : null}
      orgSlug={orgSlug}
      closeHref={closeHref}
      orgMembers={orgMembers}
      currentUserId={currentUserId}
    />
  );
}
