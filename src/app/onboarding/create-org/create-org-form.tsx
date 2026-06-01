"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createOrganization } from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyName } from "@/lib/slugify";
import type { CreateOrgState } from "@/types/app";

const initialState: CreateOrgState = {};

export function CreateOrgForm() {
  const [state, formAction, isPending] = useActionState(
    createOrganization,
    initialState,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyName(value));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Create organization
          </CardTitle>
          <CardDescription>
            This will be your team&apos;s workspace in Kalebs Tracker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Acme Corp"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Organization slug</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                placeholder="acme-corp"
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            {state.error ? (
              <p className="text-sm text-red-600" role="alert">
                {state.error}
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? "Creating…" : "Create organization"}
              </Button>
              <Button
                variant="outline"
                render={<Link href="/onboarding" />}
                nativeButton={false}
                disabled={isPending}
              >
                Back
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
