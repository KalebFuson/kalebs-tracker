"use client";

import { format } from "date-fns";
import { Check, Copy, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { revokeInvitation } from "@/app/actions/org-member";
import type { PendingInvitation } from "@/types/people";

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/onboarding/accept-invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
      title="Copy invite link"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy link
        </>
      )}
    </button>
  );
}

function RevokeButton({ invitationId, email }: { invitationId: string; email: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeInvitation(invitationId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Invite for ${email} revoked.`);
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={handleRevoke}
          disabled={isPending}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isPending ? "Revoking…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      title="Revoke invitation"
    >
      <Trash2 className="size-3.5" />
      Revoke
    </button>
  );
}

type PendingInvitationsListProps = {
  invitations: PendingInvitation[];
};

export function PendingInvitationsList({ invitations }: PendingInvitationsListProps) {
  if (invitations.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No pending invitations.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr className="border-b border-border bg-gray-50">
            <th className="py-2.5 pl-4 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Role
            </th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Invited by
            </th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sent
            </th>
            <th className="py-2.5 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <tr
              key={inv.id}
              className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 pl-4 pr-4 text-sm font-medium text-gray-900">{inv.email}</td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    inv.role === "admin"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {inv.role}
                </span>
              </td>
              <td className="py-3 pr-4 text-sm text-muted-foreground">
                {inv.invited_by_name ?? "—"}
              </td>
              <td className="py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(inv.created_at), "MMM d, yyyy")}
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center justify-end gap-1">
                  <CopyLinkButton token={inv.token} />
                  <RevokeButton invitationId={inv.id} email={inv.email} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
