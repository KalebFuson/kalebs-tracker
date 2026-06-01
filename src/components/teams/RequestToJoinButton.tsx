"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { requestToJoinTeam } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TeamJoinState } from "@/lib/teams/join-state";

type RequestToJoinButtonProps = {
  teamId: string;
  joinState: TeamJoinState;
  size?: "sm" | "default";
  className?: string;
};

export function RequestToJoinButton({
  teamId,
  joinState,
  size = "sm",
  className,
}: RequestToJoinButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (joinState === "member") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        Member
      </span>
    );
  }

  if (joinState === "pending") {
    return (
      <Button size={size} variant="outline" disabled className={className}>
        Requested
      </Button>
    );
  }

  function handleRequest() {
    startTransition(async () => {
      const result = await requestToJoinTeam(teamId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request sent");
    });
  }

  return (
    <Button
      size={size}
      variant="outline"
      className={className}
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRequest();
      }}
    >
      {isPending ? "Sending…" : "Request to join"}
    </Button>
  );
}
