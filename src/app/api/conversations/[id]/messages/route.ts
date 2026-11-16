import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function context() { const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

export async function GET(_request: Request, contextParams: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { id } = await contextParams.params;
  const { data: conversation } = await supabase.from("support_conversations").select("id,customer_id").eq("id", id).eq("customer_id", user.id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  const { data, error } = await supabase.from("support_messages").select("id,sender_id,body,attachment_url,read_at,created_at").eq("conversation_id", id).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "تعذر تحميل الرسائل" }, { status: 503 });
  await supabase.from("support_messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).neq("sender_id", user.id).is("read_at", null);
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request, contextParams: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { id } = await contextParams.params;
  const body = await request.json().catch(() => null) as { body?: unknown; attachmentUrl?: unknown } | null;
  const message = typeof body?.body === "string" ? body.body.trim().slice(0, 4000) : "";
  const attachmentUrl = typeof body?.attachmentUrl === "string" && body.attachmentUrl.startsWith("https://") ? body.attachmentUrl.slice(0, 1000) : null;
  if (!message && !attachmentUrl) return NextResponse.json({ error: "اكتبي رسالة أو أضيفي رابط مرفق" }, { status: 400 });
  const { data: conversation } = await supabase.from("support_conversations").select("id").eq("id", id).eq("customer_id", user.id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  const { data, error } = await supabase.from("support_messages").insert({ conversation_id: id, sender_id: user.id, body: message || "مرفق", attachment_url: attachmentUrl }).select("id,sender_id,body,attachment_url,read_at,created_at").single();
  if (error) return NextResponse.json({ error: "تعذر إرسال الرسالة" }, { status: 503 });
  return NextResponse.json({ data }, { status: 201 });
}
