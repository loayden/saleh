import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId") || "";
  if (!productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("reviews").select("id,rating,body,created_at").eq("product_id", productId).eq("approved", true).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "تعذر تحميل المراجعات" }, { status: 503 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "سجّلي الدخول عشان تكتبي مراجعة" }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: unknown; rating?: unknown; body?: unknown } | null;
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const rating = Number(body?.rating);
  const reviewBody = typeof body?.body === "string" ? body.body.trim().slice(0, 1000) : "";
  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewBody.length < 5) return NextResponse.json({ error: "اكتبي تقييم من نجمة إلى خمس نجوم وتعليقاً قصيراً" }, { status: 400 });
  const { data: purchased } = await supabase.from("order_items").select("id,orders!inner(user_id,status)").eq("product_id", productId).eq("orders.user_id", user.id).eq("orders.status", "delivered").limit(1);
  if (!purchased?.length) return NextResponse.json({ error: "المراجعات متاحة بعد استلام المنتج" }, { status: 403 });
  const { data, error } = await supabase.from("reviews").upsert({ user_id: user.id, product_id: productId, rating, body: reviewBody, approved: false }, { onConflict: "user_id,product_id" }).select("id,rating,body,created_at,approved").single();
  if (error) return NextResponse.json({ error: "تعذر حفظ المراجعة" }, { status: 503 });
  return NextResponse.json({ data, message: "اتحفظت المراجعة للمراجعة قبل نشرها." }, { status: 201 });
}
