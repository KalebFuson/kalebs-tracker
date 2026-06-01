"use client";

import { Download, Plus } from "lucide-react";
import { useState } from "react";

import { CreateFromTextModal } from "@/components/tasks/CreateFromTextModal";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";

export function TasksPageHeader() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track your team&apos;s ongoing work.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => console.log("Export not implemented yet")}
          >
            <Download className="size-4" />
            Export
          </Button>
          <CreateFromTextModal />
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            New Task
          </Button>
        </div>
      </div>

      <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
