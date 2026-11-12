import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll(values) { values.forEach(({ name, value, options }) => { request.cookies.set(name, value); response = NextResponse.next({ request }); response.cookies.set(name, value, options); }); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (!user && pathname === "/api/orders") return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isConfiguredAdmin = Boolean(user?.email && configuredAdminEmail && user.email.toLowerCase() === configuredAdminEmail);
  if (isConfiguredAdmin && pathname === "/account" && request.nextUrl.searchParams.get("welcome") === "1") {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }
  const protectedPages = ["/account", "/orders", "/addresses", "/merchant", "/admin"];
  const isProtectedPage = protectedPages.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!user && isProtectedPage) {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = "/auth";
    authUrl.search = "";
    authUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(authUrl);
  }
  return response;
}

export const config = { matcher: [
  { source: "/account/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
  { source: "/orders/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
  { source: "/addresses/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
  { source: "/merchant/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
  { source: "/admin/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
  { source: "/api/orders", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
] };
