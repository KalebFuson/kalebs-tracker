"use client";

import { Download } from "lucide-react";

import { CreateTaskMenu } from "@/components/tasks/CreateTaskMenu";
import { Button } from "@/components/ui/button";

export function TasksPageHeader() {
  return (
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
        <CreateTaskMenu label="New Task" />
      </div>
    </div>
  );
}
