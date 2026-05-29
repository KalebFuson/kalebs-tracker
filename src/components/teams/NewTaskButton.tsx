"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";

type NewTaskButtonProps = {
  teamId: string;
  teamName?: string;
};

export function NewTaskButton({ teamId }: NewTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700"
        size="sm"
      >
        <Plus className="size-4" />
        New Task
      </Button>
      <CreateTaskDialog
        open={open}
        onOpenChange={setOpen}
        defaultTeamId={teamId}
      />
    </>
  );
}
