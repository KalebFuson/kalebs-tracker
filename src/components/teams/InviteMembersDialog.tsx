"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";

import { sendInvitations } from "@/app/actions/invitation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { OrgTeam, SentInvitation } from "@/types/teams";

type Role = "member" | "admin";

type InviteMembersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTeamId?: string;
  orgTeams: OrgTeam[];
};

type SuccessState = {
  invitations: SentInvitation[];
};

function getInviteUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/onboarding/accept-invite/${token}`;
  }
  return `/onboarding/accept-invite/${token}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded p-1 text-muted-foreground hover:text-gray-900 hover:bg-gray-100 transition-colors"
      title="Copy link"
    >
      {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function InviteMembersDialog({
  open,
  onOpenChange,
  defaultTeamId,
  orgTeams,
}: InviteMembersDialogProps) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    defaultTeamId ? new Set([defaultTeamId]) : new Set(),
  );
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setEmails("");
    setRole("member");
    setSelectedTeamIds(defaultTeamId ? new Set([defaultTeamId]) : new Set());
    setSuccess(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) reset();
    onOpenChange(next);
  }

  function toggleTeam(teamId: string) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  function handleSubmit() {
    if (!emails.trim()) {
      toast.error("Please enter at least one email address.");
      return;
    }

    startTransition(async () => {
      const result = await sendInvitations({
        emails: [emails],
        role,
        defaultTeamIds: [...selectedTeamIds],
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setSuccess({ invitations: result.invitations });
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite New Members</DialogTitle>
          <DialogDescription>Send invitations to join Kalebs Tracker.</DialogDescription>
        </DialogHeader>

        {success ? (
          /* ── Success state ── */
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-green-800">
                {success.invitations.length} invite
                {success.invitations.length === 1 ? "" : "s"} created!
              </p>
              <p className="mt-1 text-xs text-green-700">
                Email delivery coming soon. Share these links with your invitees:
              </p>
            </div>

            <ul className="space-y-2">
              {success.invitations.map((inv) => {
                const url = getInviteUrl(inv.token);
                return (
                  <li
                    key={inv.token}
                    className="rounded-lg border border-border bg-gray-50 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-gray-700">{inv.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 truncate text-xs text-muted-foreground">{url}</code>
                      <CopyButton text={url} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <DialogFooter>
              <Button
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="space-y-5 py-2">
            {/* Email addresses */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                Email Addresses
              </Label>
              <Textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="Enter email addresses, separated by commas"
                rows={3}
                disabled={isPending}
                className="resize-none"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["member", "admin"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-3.5 text-left transition-all",
                      role === r
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-white hover:border-primary/40",
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        {r === "member" ? (
                          <User className="size-4 text-primary" />
                        ) : (
                          <Shield className="size-4 text-primary" />
                        )}
                        <span className="text-sm font-semibold capitalize text-gray-900">
                          {r}
                        </span>
                      </div>
                      {role === r && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r === "member"
                        ? "Can view and manage assigned tasks and team resources."
                        : "Full access to manage organization, billing, and all settings."}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Teams */}
            {orgTeams.length > 0 && (
              <div className="space-y-2">
                <Label>Default Teams (Optional)</Label>
                <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
                  {orgTeams.map((team) => (
                    <label
                      key={team.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={selectedTeamIds.has(team.id)}
                        onCheckedChange={() => toggleTeam(team.id)}
                        disabled={isPending}
                      />
                      <span className="text-sm text-gray-700">{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
                className="gap-2"
                onClick={handleSubmit}
                disabled={isPending}
              >
                <Mail className="size-4" />
                {isPending ? "Sending…" : "Send Invites"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
