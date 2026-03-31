import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip webhook routes
  if (pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  const { supabase, user, response } = await updateSession(request);

  // Extract role: JWT custom claims (via getSession) > user_metadata > fallback
  let role: string | null = null;
  if (user) {
    // The custom_access_token_hook injects user_role into JWT claims.
    // getSession() decodes the JWT locally (no network call) to access these claims.
    const { data: { session } } = await supabase.auth.getSession();
    const jwtRole = (session?.user as unknown as Record<string, unknown>)?.user_role as string | undefined;
    role = jwtRole ?? user.user_metadata?.role ?? "sub_office";
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // No session + protected route → redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Has session + public route → redirect to role dashboard
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin/dashboard" : "/office/dashboard";
    return NextResponse.redirect(url);
  }

  // /admin/* + role != admin → redirect to office dashboard
  if (user && pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/office/dashboard";
    return NextResponse.redirect(url);
  }

  // /office/* + role != sub_office → redirect to admin dashboard
  if (user && pathname.startsWith("/office") && role !== "sub_office") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  // Root → redirect to role dashboard
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin/dashboard" : "/office/dashboard";
    return NextResponse.redirect(url);
  }

  // Root with no session → redirect to login
  if (!user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
