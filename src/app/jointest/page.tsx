"use client";

import { useState, useTransition } from "react";

import { requestToJoinTeam, respondToJoinRequest } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActionResult = { ok: true } | { ok: false; error: string };

function formatResult(label: string, result: ActionResult | null): string {
  if (!result) return `${label}: (none)`;
  if (result.ok) return `${label}: ok`;
  return `${label}: error — ${result.error}`;
}

export default function JoinTestPage() {
  const [teamId, setTeamId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [requestResult, setRequestResult] = useState<ActionResult | null>(null);
  const [respondResult, setRespondResult] = useState<ActionResult | null>(null);
  const [isRequestPending, startRequest] = useTransition();
  const [isRespondPending, startRespond] = useTransition();

  function handleRequest() {
    startRequest(async () => {
      const result = await requestToJoinTeam(teamId.trim());
      setRequestResult(result);
    });
  }

  function handleRespond(decision: "approved" | "denied") {
    startRespond(async () => {
      const result = await respondToJoinRequest(requestId.trim(), decision);
      setRespondResult(result);
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-10 p-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Join request test (temporary)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Delete src/app/jointest after testing.</p>
      </div>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold text-gray-900">Request to join</h2>
        <div className="space-y-1.5">
          <Label htmlFor="team-id">teamId</Label>
          <Input
            id="team-id"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="uuid"
            disabled={isRequestPending}
          />
        </div>
        <Button onClick={handleRequest} disabled={isRequestPending || !teamId.trim()}>
          {isRequestPending ? "Requesting…" : "Request to join"}
        </Button>
        <p className="font-mono text-sm text-muted-foreground">
          {formatResult("requestToJoinTeam", requestResult)}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold text-gray-900">Respond to request</h2>
        <div className="space-y-1.5">
          <Label htmlFor="request-id">requestId</Label>
          <Input
            id="request-id"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="uuid"
            disabled={isRespondPending}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleRespond("approved")}
            disabled={isRespondPending || !requestId.trim()}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRespond("denied")}
            disabled={isRespondPending || !requestId.trim()}
          >
            Deny
          </Button>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {formatResult("respondToJoinRequest", respondResult)}
        </p>
      </section>
    </div>
  );
}
