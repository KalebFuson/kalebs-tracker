"use client";

import { Bot, FileText, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CreateFromTextModal } from "./CreateFromTextModal";
import { CreateTaskDialog } from "./CreateTaskDialog";

type CreateTaskMenuProps = {
  label: string;
  defaultTeamId?: string | null;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
};

export function CreateTaskMenu({
  label,
  defaultTeamId,
  variant = "default",
  className,
}: CreateTaskMenuProps) {
  const [mode, setMode] = useState<null | "choose" | "single" | "ai">(null);

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={() => setMode("choose")}
      >
        <Plus className="size-4" />
        {label}
      </Button>

      <Dialog open={mode === "choose"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Choose how you want to create tasks.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <button
              type="button"
              className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-gray-50"
              onClick={() => setMode("single")}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Create a Single Task</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Fill in one task manually.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-gray-50"
              onClick={() => setMode("ai")}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                  <Bot className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Create Multiple Tasks with Text & AI
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Paste notes or an email; AI extracts tasks to review.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateTaskDialog
        open={mode === "single"}
        onOpenChange={(open) => !open && setMode(null)}
        defaultTeamId={defaultTeamId}
      />

      <CreateFromTextModal
        open={mode === "ai"}
        onOpenChange={(open) => !open && setMode(null)}
        hideTrigger
      />
    </>
  );
}
