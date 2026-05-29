import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

function isNoSessionError(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("auth session missing") ||
    normalized.includes("session missing") ||
    normalized.includes("no session")
  );
}

export default async function Home() {
  let connectionStatus: React.ReactNode;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (data?.user) {
      connectionStatus = (
        <div className="space-y-2">
          <p className="font-medium text-green-600">
            ✅ Connected to Supabase
          </p>
          <p className="text-sm text-muted-foreground">
            Signed in as {data.user.email}
          </p>
        </div>
      );
    } else if (!data && !error) {
      connectionStatus = (
        <div className="space-y-2">
          <p className="font-medium text-red-600">
            ❌ Supabase connection failed
          </p>
          <p className="font-mono text-xs text-red-600/80">
            No response from Supabase
          </p>
        </div>
      );
    } else if (!data?.user && (!error || isNoSessionError(error.message))) {
      connectionStatus = (
        <div className="space-y-2">
          <p className="font-medium text-green-600">
            ✅ Connected to Supabase
          </p>
          <p className="text-sm text-muted-foreground">
            Anonymous session (no user signed in)
          </p>
        </div>
      );
    } else {
      connectionStatus = (
        <div className="space-y-2">
          <p className="font-medium text-red-600">
            ❌ Supabase connection failed
          </p>
          <p className="font-mono text-xs text-red-600/80">
            {error?.message ?? "Unknown error"}
          </p>
        </div>
      );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reach Supabase";
    connectionStatus = (
      <div className="space-y-2">
        <p className="font-medium text-red-600">
          ❌ Supabase connection failed
        </p>
        <p className="font-mono text-xs text-red-600/80">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Kalebs Tracker</CardTitle>
          <CardDescription>Internal task management.</CardDescription>
        </CardHeader>
        <CardContent>{connectionStatus}</CardContent>
      </Card>
    </div>
  );
}
