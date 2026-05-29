import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Mail } from "lucide-react";

import { AcceptInviteButton } from "@/components/invite/AcceptInviteButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AcceptInvitePageProps = {
  params: Promise<{ token: string }>;
};

// ---------------------------------------------------------------------------
// Shared layout wrapper
// ---------------------------------------------------------------------------
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// State A — error states (not found, expired, already accepted)
// ---------------------------------------------------------------------------
type ErrorCardProps = {
  icon: React.ReactNode;
  title: string;
  message: string;
};

function ErrorCard({ icon, title, message }: ErrorCardProps) {
  return (
    <PageShell>
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-gray-100">
            {icon}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Back to login →
          </Link>
        </CardContent>
      </Card>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params;

  // ── 1. Fetch invitation via SECURITY DEFINER RPC (works unauthenticated) ──
  const supabase = await createClient();

  const { data: rows, error: rpcError } = await supabase.rpc(
    "get_invitation_by_token",
    { p_token: token },
  );

  const invitation = rows?.[0] ?? null;

  // ── State A: not found ──
  if (rpcError || !invitation) {
    return (
      <ErrorCard
        icon={<AlertCircle className="size-7 text-muted-foreground" />}
        title="Invitation not found"
        message="This invite link is invalid or has been removed. Ask your admin to resend it."
      />
    );
  }

  // ── State A: expired ──
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <ErrorCard
        icon={<Clock className="size-7 text-muted-foreground" />}
        title="Invitation expired"
        message="This invite link has expired (invitations are valid for 7 days). Ask your admin to send a new one."
      />
    );
  }

  // ── State A: already accepted ──
  if (invitation.accepted_at) {
    return (
      <ErrorCard
        icon={<CheckCircle2 className="size-7 text-green-600" />}
        title="Invitation already accepted"
        message="This invite has already been used. Sign in to access your workspace."
      />
    );
  }

  // ── 2. Get current user ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 3. Resolve team names for default_team_ids (admin client bypasses RLS) ──
  const teamIds: string[] = invitation.default_team_ids ?? [];
  let teamNames: string[] = [];
  if (teamIds.length > 0) {
    const admin = createAdminClient();
    const { data: teams } = await admin
      .from("teams")
      .select("name")
      .in("id", teamIds);
    teamNames = (teams ?? []).map((t: { name: string }) => t.name);
  }

  // ── State B: not signed in ──
  if (!user) {
    const emailParam = encodeURIComponent(invitation.email);
    const signupHref = `/signup?invite=${token}&email=${emailParam}`;
    const loginHref = `/login?invite=${token}&email=${emailParam}`;

    return (
      <PageShell>
        <Card className="shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-indigo-100">
              <Mail className="size-6 text-indigo-600" />
            </div>
            <CardTitle className="text-xl">
              {"You've been invited to join"}{" "}
              <span className="text-indigo-600">{invitation.org_name}</span>
            </CardTitle>
            <CardDescription>
              {"You've been invited as a "}
              <span className="font-medium">{invitation.role}</span>
              {". The invite was sent to "}
              <span className="font-medium text-gray-700">{invitation.email}</span>
              {" — use that email to sign in or create an account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamNames.length > 0 && (
              <div className="rounded-lg border border-border bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {"You'll be added to"}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {teamNames.map((name) => (
                    <li key={name} className="text-sm text-gray-700">
                      · {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href={signupHref} className="block">
              <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                Create account
              </Button>
            </Link>
            <Link href={loginHref} className="block">
              <Button variant="outline" className="w-full">
                Sign in to existing account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── State D: signed in as a DIFFERENT email ──
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    async function handleSignOut() {
      "use server";
      const serverSupabase = await createClient();
      await serverSupabase.auth.signOut();
      redirect(`/onboarding/accept-invite/${token}`);
    }

    return (
      <PageShell>
        <Card className="shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="size-6 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Wrong account</CardTitle>
            <CardDescription>
              This invitation is for{" "}
              <span className="font-medium text-gray-700">{invitation.email}</span>
              {". You're currently signed in as "}
              <span className="font-medium text-gray-700">{user.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={handleSignOut}>
              <Button
                type="submit"
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Sign out and accept with correct account
              </Button>
            </form>
            <Link href="/dashboard" className="block">
              <Button variant="ghost" className="w-full text-muted-foreground">
                Continue as {user.email}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── State C: signed in as the invited email ──
  return (
    <PageShell>
      <Card className="shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-indigo-100">
            <Mail className="size-6 text-indigo-600" />
          </div>
          <CardTitle className="text-xl">
            Join <span className="text-indigo-600">{invitation.org_name}</span>?
          </CardTitle>
          <CardDescription>
            {"You've been invited as a "}
            <span className="font-medium">{invitation.role}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamNames.length > 0 && (
            <div className="rounded-lg border border-border bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {"You'll be added to"}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {teamNames.map((name) => (
                  <li key={name} className="text-sm text-gray-700">
                    · {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AcceptInviteButton token={token} />

          <Link href="/dashboard" className="block">
            <Button variant="ghost" className="w-full text-muted-foreground text-sm">
              Decline — stay on dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </PageShell>
  );
}
