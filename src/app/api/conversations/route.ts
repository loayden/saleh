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
  const { data, error } = await supabase.from("support_conversations").select("id,subject,status,order_id,tailoring_request_id,created_at,updated_at").eq("customer_id", user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "تعذر تحميل المحادثات" }, { status: 503 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { subject?: unknown; body?: unknown; orderId?: unknown; tailoringRequestId?: unknown } | null;
  const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 160) : "";
  const message = typeof body?.body === "string" ? body.body.trim().slice(0, 4000) : "";
  const orderId = typeof body?.orderId === "string" && body.orderId ? body.orderId : null;
  const tailoringRequestId = typeof body?.tailoringRequestId === "string" && body.tailoringRequestId ? body.tailoringRequestId : null;
  if (!subject || !message) return NextResponse.json({ error: "اكتبي موضوع الرسالة ومحتواها" }, { status: 400 });
  if (orderId) { const { data } = await supabase.from("orders").select("id").eq("id", orderId).eq("user_id", user.id).maybeSingle(); if (!data) return NextResponse.json({ error: "الطلب المرتبط غير صالح" }, { status: 400 }); }
  if (tailoringRequestId) { const { data } = await supabase.from("tailoring_requests").select("id").eq("id", tailoringRequestId).eq("user_id", user.id).maybeSingle(); if (!data) return NextResponse.json({ error: "طلب التفصيل المرتبط غير صالح" }, { status: 400 }); }
  const { data: conversation, error } = await supabase.from("support_conversations").insert({ customer_id: user.id, subject, order_id: orderId, tailoring_request_id: tailoringRequestId }).select("id,subject,status,order_id,tailoring_request_id,created_at,updated_at").single();
  if (error || !conversation) return NextResponse.json({ error: "تعذر إنشاء المحادثة" }, { status: 503 });
  const { error: messageError } = await supabase.from("support_messages").insert({ conversation_id: conversation.id, sender_id: user.id, body: message });
  if (messageError) { await supabase.from("support_conversations").delete().eq("id", conversation.id); return NextResponse.json({ error: "تعذر حفظ الرسالة" }, { status: 503 }); }
  return NextResponse.json({ data: conversation }, { status: 201 });
}
