import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "سجّلي الدخول عشان نتابع طلب العينة" }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: unknown; color?: unknown } | null;
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const color = typeof body?.color === "string" ? body.color.trim().slice(0, 120) : "";
  if (!productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  const { data: product } = await supabase.from("fabric_products").select("id").eq("id", productId).eq("active", true).eq("verified", true).maybeSingle();
  if (!product) return NextResponse.json({ error: "المنتج غير متاح" }, { status: 409 });
  const { data, error } = await supabase.from("sample_requests").upsert({ user_id: user.id, product_id: productId, color }, { onConflict: "user_id,product_id,color" }).select("id,status,created_at").single();
  if (error) return NextResponse.json({ error: "تعذر تسجيل طلب العينة" }, { status: 503 });
  return NextResponse.json({ request: data }, { status: 201 });
}
