import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client that BYPASSES Row Level Security.
 *
 * DANGER: Only import this from server-side code (Server Actions, Route Handlers,
 * Server Components). NEVER import from a "use client" component.
 *
 * Use only for trusted bootstrap operations where RLS cannot apply yet
 * (e.g., creating the first organization for a new user).
 *
 * Every caller MUST first authenticate the user via the regular server client
 * and pass user.id explicitly. Never trust client-provided user IDs.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
