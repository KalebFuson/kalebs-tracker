import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function copyCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  sessionResponse: NextResponse,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirectResponse = NextResponse.redirect(url);
  copyCookies(sessionResponse, redirectResponse);
  return redirectResponse;
}

function isStaticAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return true;
  }
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname);
}

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/signup") {
    return true;
  }
  if (pathname.startsWith("/auth/")) {
    return true;
  }
  if (pathname.startsWith("/onboarding/accept-invite/")) {
    return true;
  }
  return false;
}

function isOnboardingRoute(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isStaticAsset(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (!isPublicRoute(pathname)) {
      return redirectWithCookies(request, "/login", supabaseResponse);
    }
    return supabaseResponse;
  }

  if (pathname === "/login" || pathname === "/signup") {
    return redirectWithCookies(request, "/dashboard", supabaseResponse);
  }

  const { data: memberships } = await supabase
    .from("org_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  const hasOrgMembership =
    memberships !== null && memberships.length > 0;

  if (!hasOrgMembership && !isOnboardingRoute(pathname)) {
    return redirectWithCookies(request, "/onboarding", supabaseResponse);
  }

  return supabaseResponse;
}
