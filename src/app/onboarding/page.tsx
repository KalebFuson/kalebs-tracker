import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("org_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-indigo-600">
            Welcome to Kalebs Tracker
          </CardTitle>
          <CardDescription>
            Get started by creating an organization or accepting an invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            render={<Link href="/onboarding/create-org" />}
            nativeButton={false}
            className="h-auto w-full justify-start bg-indigo-600 px-4 py-6 text-left text-white hover:bg-indigo-700"
          >
            <div>
              <p className="font-semibold">Create a new organization</p>
              <p className="mt-1 text-sm font-normal text-indigo-100">
                Set up a workspace for your team
              </p>
            </div>
          </Button>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-6">
            <p className="font-semibold text-foreground">I have an invitation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click the link in your invitation email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
