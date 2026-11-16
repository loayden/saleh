import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "رقم الطلب غير صالح" }, { status: 400 });
  const { data, error } = await supabase.from("orders").select("id,status,subtotal_egp,delivery_fee_egp,city,district,address_line,phone,created_at,payments(status,provider,provider_reference),deliveries(status,provider,tracking_reference),order_items(id,meters,unit_price_egp,color,fabric_products(name_ar,slug,fabric_type,image_url)),order_status_events(id,status,note,created_at)").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "تعذر قراءة الطلب" }, { status: 503 });
  if (!data) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  const payment = Array.isArray(data.payments) ? data.payments[0] : data.payments;
  return NextResponse.json({ data: { ...data, payment: payment || null } });
}
