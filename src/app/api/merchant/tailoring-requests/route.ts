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
  const { error } = await supabase.from("tailoring_requests").update({ status: body.status, tailoring_price_egp: price }).eq("id", body.requestId);
  if (error) return NextResponse.json({ error: "تعذر تحديث طلب التفصيل" }, { status: 503 });
  return NextResponse.json({ updated: true, status: body.status, tailoringPrice: price });
}
