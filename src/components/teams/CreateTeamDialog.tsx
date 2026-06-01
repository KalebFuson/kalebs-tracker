"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createTeam } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Operations",
  "Sales",
  "HR",
  "Other",
] as const;

const NONE = "_none";

type CreateTeamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  name: string;
  department: string | null;
  description: string;
};

const initialState: FormState = { name: "", department: null, description: "" };

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setForm(initialState);
    setNameError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) reset();
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Team name is required.");
      return;
    }
    setNameError(null);

    startTransition(async () => {
      const result = await createTeam({
        name: form.name.trim(),
        department: form.department,
        description: form.description.trim() || null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Team created!");
      reset();
      onOpenChange(false);
      router.push(`/teams/${result.teamId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>Add a new team to your organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="team-name">
              Team Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="team-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Engineering Core"
              disabled={isPending}
              aria-invalid={Boolean(nameError)}
            />
            {nameError && <p className="text-sm text-red-600">{nameError}</p>}
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label>Department (optional)</Label>
            <Select
              value={form.department ?? NONE}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, department: v === NONE ? null : v }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe this team's purpose…"
              rows={3}
              disabled={isPending}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Creating…" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
