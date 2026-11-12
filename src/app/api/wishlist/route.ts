import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function getUserClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUserClient();
  if (!user) return NextResponse.json({ data: [], authenticated: false, meta: { live: true, count: 0 } });
  const { data, error } = await supabase.from("wishlists").select("product_id,fabric_products(id,slug,name_ar,price_egp,image_url)").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "تعذر تحميل المفضلة" }, { status: 503 });
  return NextResponse.json({ data: data || [], meta: { live: true, count: data?.length || 0 } });
}

export async function POST(request: Request) {
  const { supabase, user } = await getUserClient();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: string } | null;
  if (typeof body?.productId !== "string" || !body.productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  const { data: product } = await supabase.from("fabric_products").select("id").eq("id", body.productId).eq("active", true).eq("verified", true).maybeSingle();
  if (!product) return NextResponse.json({ error: "المنتج غير متاح" }, { status: 409 });
  const { error } = await supabase.from("wishlists").upsert({ user_id: user.id, product_id: body.productId }, { onConflict: "user_id,product_id" });
  if (error) return NextResponse.json({ error: "تعذر حفظ المنتج" }, { status: 503 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getUserClient();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: string } | null;
  if (typeof body?.productId !== "string" || !body.productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", body.productId);
  if (error) return NextResponse.json({ error: "تعذر حذف المنتج" }, { status: 503 });
  return NextResponse.json({ saved: false });
}
