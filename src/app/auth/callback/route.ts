import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles auth redirects from email links (e.g. password reset in a future phase).
 * Email + password sign-in does not use this route by default.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
