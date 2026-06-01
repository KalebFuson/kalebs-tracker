"use client";

import { format } from "date-fns";
import { useTransition } from "react";
import { toast } from "sonner";

import { respondToJoinRequest } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import type { PendingJoinRequest } from "@/types/teams";

type PendingJoinRequestsListProps = {
  requests: PendingJoinRequest[];
};

export function PendingJoinRequestsList({ requests }: PendingJoinRequestsListProps) {
  const [isPending, startTransition] = useTransition();

  if (requests.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">No pending requests.</p>
    );
  }

  function handleRespond(requestId: string, decision: "approved" | "denied", label: string) {
    startTransition(async () => {
      const result = await respondToJoinRequest(requestId, decision);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Request ${label}.`);
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px]">
        <thead>
          <tr className="border-b border-border bg-gray-50">
            <th className="py-2.5 pl-4 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Member
            </th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Requested
            </th>
            <th className="py-2.5 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const displayName = req.full_name ?? req.email;
            return (
              <tr
                key={req.id}
                className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 pl-4 pr-4">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  {req.full_name && (
                    <p className="text-xs text-muted-foreground">{req.email}</p>
                  )}
                </td>
                <td className="py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(req.created_at), "MMM d, yyyy")}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRespond(req.id, "approved", "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleRespond(req.id, "denied", "denied")}
                    >
                      Deny
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
