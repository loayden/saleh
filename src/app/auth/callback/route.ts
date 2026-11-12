import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { safeAuthNext } from "@/lib/auth-redirect";

function redirectToAuth(request: Request, reason: string) {
  const url = new URL("/auth", request.url);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthNext(requestUrl.searchParams.get("next"));

  if (requestUrl.searchParams.get("error")) return redirectToAuth(request, "confirmation_failed");
  if (!code) return redirectToAuth(request, "confirmation_failed");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectToAuth(request, "confirmation_failed");

  const destination = new URL(next, requestUrl.origin);
  return NextResponse.redirect(destination);
}
