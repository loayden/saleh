import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const statuses = ["new", "confirmed", "preparing", "handed_to_carrier", "in_transit", "delivered", "cancelled", "returned"] as const;

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "merchant" && profile?.role !== "admin") return NextResponse.json({ error: "صلاحية التاجر أو الإدارة مطلوبة" }, { status: 403 });
  const body = await request.json().catch(() => null) as { orderId?: string; status?: string } | null;
  if (typeof body?.orderId !== "string" || !body.orderId || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "رقم الطلب أو الحالة غير صالح" }, { status: 400 });
  const status = body.status as typeof statuses[number];
  const { data: order } = await supabase.from("orders").select("id,user_id").eq("id", body.orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  const { error } = await supabase.from("orders").update({ status }).eq("id", body.orderId);
  if (error) return NextResponse.json({ error: "تعذر تحديث حالة الطلب" }, { status: 503 });
  const { error: deliveryError } = await supabase.from("deliveries").update({ status }).eq("order_id", body.orderId);
  if (deliveryError) return NextResponse.json({ error: "تم تحديث الطلب لكن تعذر تحديث حالة التوصيل" }, { status: 503 });
  if (order.user_id) {
    const labels: Record<string, string> = { new: "تم استلام طلبك", confirmed: "تم تأكيد طلبك", preparing: "بنجهز طلبك", handed_to_carrier: "طلبك مع شركة التوصيل", in_transit: "طلبك في الطريق", delivered: "تم تسليم طلبك", cancelled: "تم إلغاء طلبك", returned: "تم إرجاع طلبك" };
    await supabase.from("notifications").insert({ user_id: order.user_id, title: labels[status] || "تحديث على طلبك", body: `حالة الطلب #${body.orderId.slice(0, 8)}: ${labels[status] || status}` });
  }
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "order.status_updated", entity_type: "order", entity_id: body.orderId, metadata: { status } });
  return NextResponse.json({ updated: true, status });
}
