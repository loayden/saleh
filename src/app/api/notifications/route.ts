import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function context() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { data, error } = await supabase.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "تعذر تحميل الإشعارات" }, { status: 503 });
  return NextResponse.json({ data: data || [] });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; readAll?: boolean; read?: boolean } | null;
  const readAt = body?.read === false ? null : new Date().toISOString();
  if (body?.readAll) {
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("user_id", user.id).is("read_at", null);
    if (error) return NextResponse.json({ error: "تعذر تحديث الإشعارات" }, { status: 503 });
    return NextResponse.json({ updated: true, all: true });
  }
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "الإشعار مطلوب" }, { status: 400 });
  const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", body.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "تعذر تحديث الإشعار" }, { status: 503 });
  return NextResponse.json({ updated: true });
}
