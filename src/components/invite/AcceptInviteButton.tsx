"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { acceptInvitation } from "@/app/actions/invitation";
import { Button } from "@/components/ui/button";

type AcceptInviteButtonProps = {
  token: string;
};

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitation(token);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
      >
        {isPending ? "Accepting…" : "Accept invitation"}
      </Button>
    </div>
  );
}
