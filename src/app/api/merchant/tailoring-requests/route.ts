import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const statuses = ["new", "reviewing", "quoted", "accepted", "in_progress", "completed", "cancelled"] as const;

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "merchant" && profile?.role !== "admin") return NextResponse.json({ error: "صلاحية التاجر أو الإدارة مطلوبة" }, { status: 403 });
  const body = await request.json().catch(() => null) as { requestId?: string; status?: string; tailoringPrice?: number | null } | null;
  if (typeof body?.requestId !== "string" || !body.requestId || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "رقم الطلب أو الحالة غير صالح" }, { status: 400 });
  const price = body.tailoringPrice === null || body.tailoringPrice === undefined ? null : Number(body.tailoringPrice);
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1_000_000)) return NextResponse.json({ error: "سعر التفصيل غير صالح" }, { status: 400 });
  const { data: requestRow } = await supabase.from("tailoring_requests").select("id,user_id").eq("id", body.requestId).maybeSingle();
  if (!requestRow) return NextResponse.json({ error: "طلب التفصيل غير موجود" }, { status: 404 });
  const { error } = await supabase.from("tailoring_requests").update({ status: body.status, tailoring_price_egp: price }).eq("id", body.requestId);
  if (error) return NextResponse.json({ error: "تعذر تحديث طلب التفصيل" }, { status: 503 });
  if (requestRow.user_id) await supabase.from("notifications").insert({ user_id: requestRow.user_id, title: "تحديث على طلب التفصيل", body: `طلب ${body.requestId.slice(0, 8)} أصبح: ${body.status}${price !== null ? ` · السعر المقترح ${price.toLocaleString("ar-EG")} ج.م` : ""}` });
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "tailoring_request.updated", entity_type: "tailoring_request", entity_id: body.requestId, metadata: { status: body.status, tailoringPrice: price } });
  return NextResponse.json({ updated: true, status: body.status, tailoringPrice: price });
}
