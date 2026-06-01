"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTeam, updateTeam } from "@/app/actions/team";
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
import { Separator } from "@/components/ui/separator";
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

export type TeamForSettings = {
  id: string;
  name: string;
  department: string | null;
  description: string | null;
};

type TeamSettingsDialogProps = {
  team: TeamForSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  name: string;
  department: string | null;
  description: string;
};

export function TeamSettingsDialog({
  team,
  open,
  onOpenChange,
}: TeamSettingsDialogProps) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: team.name,
    department: team.department,
    description: team.description ?? "",
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  // Sync form when dialog opens / team prop changes
  const isPending = isSaving || isDeleting;

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) {
      // Reset to current team values on close
      setForm({
        name: team.name,
        department: team.department,
        description: team.description ?? "",
      });
      setNameError(null);
      setConfirmingDelete(false);
    }
    onOpenChange(next);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Team name is required.");
      return;
    }
    setNameError(null);

    startSave(async () => {
      const result = await updateTeam({
        teamId: team.id,
        updates: {
          name: form.name.trim(),
          department: form.department,
          description: form.description.trim() || null,
        },
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Team updated.");
      onOpenChange(false);
    });
  }

  function handleDeleteConfirm() {
    startDelete(async () => {
      const result = await deleteTeam(team.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Team deleted.");
      onOpenChange(false);
      router.push("/teams");
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Team settings</DialogTitle>
          <DialogDescription>Update the details for this team.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-team-name">
              Team Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="settings-team-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              disabled={isPending}
              aria-invalid={Boolean(nameError)}
            />
            {nameError && <p className="text-sm text-red-600">{nameError}</p>}
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select
              value={form.department ?? NONE}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, department: v === NONE ? null : v }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
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
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>

        {/* Danger zone */}
        <Separator />
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-red-700">Danger Zone</p>
            <p className="mt-0.5 text-xs text-red-600">
              Deleting this team is permanent. Tasks will keep their data but lose their team
              association.
            </p>
          </div>

          {confirmingDelete ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-700">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={isPending}
                >
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              disabled={isPending}
            >
              Delete team
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
