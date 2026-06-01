"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/actions/update-task";
import { cn } from "@/lib/utils";

type EditableTitleProps = {
  taskId: string;
  currentTitle: string;
};

export function EditableTitle({ taskId, currentTitle }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticTitle, setOptimisticTitle] = useOptimistic(currentTitle);

  function startEditing() {
    setDraft(optimisticTitle);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  }

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      // Don't save an empty title — revert
      cancel();
      return;
    }
    setIsEditing(false);
    if (trimmed === optimisticTitle) return;
    startTransition(async () => {
      setOptimisticTitle(trimmed);
      const result = await updateTask({ taskId, updates: { title: trimmed } });
      if (!result.ok) toast.error(`Failed to update title: ${result.error}`);
    });
  }

  function cancel() {
    setIsEditing(false);
    setDraft(optimisticTitle);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-primary/40 bg-white px-2 py-1 text-3xl font-bold leading-snug text-gray-900 outline-none ring-2 ring-primary/20"
      />
    );
  }

  return (
    <h2
      onClick={startEditing}
      title="Click to edit title"
      className={cn(
        "cursor-text text-3xl font-bold leading-snug text-gray-900 decoration-gray-300 underline-offset-4 hover:underline",
        isPending && "opacity-60",
      )}
    >
      {optimisticTitle}
    </h2>
  );
}
