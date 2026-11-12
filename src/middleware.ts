import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll(values) { values.forEach(({ name, value, options }) => { request.cookies.set(name, value); response = NextResponse.next({ request }); response.cookies.set(name, value, options); }); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (!user && pathname === "/api/orders") return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
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

export const config = { matcher: ["/account/:path*", "/orders/:path*", "/addresses/:path*", "/merchant/:path*", "/admin/:path*", "/api/orders"] };
