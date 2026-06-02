"use client";

import { CreateTaskMenu } from "@/components/tasks/CreateTaskMenu";

type NewTaskButtonProps = {
  teamId: string;
  teamName?: string;
};

export function NewTaskButton({ teamId }: NewTaskButtonProps) {
  return <CreateTaskMenu label="New Task" className="gap-1.5" defaultTeamId={teamId} />;
}
