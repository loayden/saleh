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
  const { data, error } = await supabase.from("waitlist_subscriptions").select("id,product_id,color,created_at,fabric_products(name_ar,slug)").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "تعذر تحميل قائمة الانتظار" }, { status: 503 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "سجّلي الدخول عشان نبلغك عند التوفر" }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: unknown; color?: unknown } | null;
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const color = typeof body?.color === "string" ? body.color.trim().slice(0, 120) : "";
  if (!productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  const { data: product } = await supabase.from("fabric_products").select("id").eq("id", productId).eq("active", true).eq("verified", true).maybeSingle();
  if (!product) return NextResponse.json({ error: "المنتج غير متاح" }, { status: 409 });
  const { error } = await supabase.from("waitlist_subscriptions").upsert({ user_id: user.id, product_id: productId, color }, { onConflict: "user_id,product_id,color" });
  if (error) return NextResponse.json({ error: "تعذر تسجيل طلب التنبيه" }, { status: 503 });
  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: unknown; color?: unknown } | null;
  if (typeof body?.productId !== "string" || !body.productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  const color = typeof body.color === "string" ? body.color.trim().slice(0, 120) : "";
  const { error } = await supabase.from("waitlist_subscriptions").delete().eq("user_id", user.id).eq("product_id", body.productId).eq("color", color);
  if (error) return NextResponse.json({ error: "تعذر إلغاء التنبيه" }, { status: 503 });
  return NextResponse.json({ subscribed: false });
}
