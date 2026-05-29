"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/actions/update-task";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditableDescriptionProps = {
  taskId: string;
  currentDescription: string | null;
};

export function EditableDescription({ taskId, currentDescription }: EditableDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentDescription ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticDesc, setOptimisticDesc] = useOptimistic(currentDescription);

  function startEditing() {
    setDraft(optimisticDesc ?? "");
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
  }

  function save() {
    const value = draft.trim() || null;
    setIsEditing(false);
    if (value === optimisticDesc) return;
    startTransition(async () => {
      setOptimisticDesc(value);
      const result = await updateTask({ taskId, updates: { description: value } });
      if (!result.ok) toast.error(`Failed to update description: ${result.error}`);
    });
  }

  function cancel() {
    setIsEditing(false);
    setDraft(optimisticDesc ?? "");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") cancel();
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Description
      </p>

      {isEditing ? (
        <div className="rounded-xl border border-indigo-300 bg-white p-4 ring-2 ring-indigo-100">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
            placeholder="Add a description..."
            className="w-full resize-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-muted-foreground/60"
          />
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={save}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <span className="ml-1 text-xs text-muted-foreground">⌘↵ to save · Esc to cancel</span>
          </div>
        </div>
      ) : (
        /* The whole card is the click target */
        <div
          onClick={startEditing}
          title="Click to edit description"
          className={cn(
            "min-h-[80px] cursor-text rounded-xl border border-border bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30",
            isPending && "opacity-60",
          )}
        >
          {optimisticDesc ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {optimisticDesc}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/70">Add a description...</p>
          )}
        </div>
      )}
    </div>
  );
}
