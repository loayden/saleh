import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function merchantContext() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, role: null, error: NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "merchant" && profile?.role !== "admin") return { supabase, role: null, error: NextResponse.json({ error: "صلاحية التاجر أو الإدارة مطلوبة" }, { status: 403 }) };
  return { supabase, role: profile.role, error: null };
}

function parseBody(body: Record<string, unknown> | null) {
  const nameAr = typeof body?.nameAr === "string" ? body.nameAr.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const fabricType = typeof body?.fabricType === "string" ? body.fabricType.trim() : "";
  const price = Number(body?.priceEgp);
  const meters = Number(body?.meters);
  const width = body?.widthCm === "" || body?.widthCm == null ? null : Number(body.widthCm);
  const colors = Array.isArray(body?.colors) ? body.colors.filter((color): color is string => typeof color === "string").map((color) => color.trim()).filter(Boolean).slice(0, 20) : [];
  if (!nameAr || !/^[a-z0-9-]{2,100}$/.test(slug) || !fabricType || !Number.isFinite(price) || price < 0 || !Number.isFinite(meters) || meters < 0 || (width !== null && (!Number.isInteger(width) || width <= 0))) return null;
  return { name_ar: nameAr.slice(0, 160), slug, fabric_type: fabricType.slice(0, 100), price_egp: price, width_cm: width, colors, note: typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : null, feel: typeof body?.feel === "string" ? body.feel.trim().slice(0, 200) : null, image_url: typeof body?.imageUrl === "string" && body.imageUrl.startsWith("https://") ? body.imageUrl.trim().slice(0, 1000) : null, meters };
}

export async function POST(request: Request) {
  const { supabase, error } = await merchantContext();
  if (error) return error;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const product = parseBody(body);
  if (!product) return NextResponse.json({ error: "بيانات المنتج أو المخزون غير صالحة" }, { status: 400 });
  const { data, error: insertError } = await supabase.from("fabric_products").insert({ name_ar: product.name_ar, slug: product.slug, fabric_type: product.fabric_type, price_egp: product.price_egp, width_cm: product.width_cm, colors: product.colors, note: product.note, feel: product.feel, image_url: product.image_url, verified: false, active: true }).select("id,slug").single();
  if (insertError || !data) return NextResponse.json({ error: insertError?.code === "23505" ? "هذا الرابط المختصر مستخدم بالفعل" : "تعذر إنشاء المنتج" }, { status: 409 });
  const { error: inventoryError } = await supabase.from("inventory").insert({ product_id: data.id, meters: product.meters });
  if (inventoryError) { await supabase.from("fabric_products").delete().eq("id", data.id); return NextResponse.json({ error: "تعذر حفظ المخزون" }, { status: 503 }); }
  return NextResponse.json({ product: data, verified: false }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, role, error } = await merchantContext();
  if (error) return error;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const action = typeof body?.action === "string" ? body.action : "";
  if (!productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  if (action === "stock") {
    const meters = Number(body?.meters);
    if (!Number.isFinite(meters) || meters < 0 || meters > 100000) return NextResponse.json({ error: "المخزون غير صالح" }, { status: 400 });
    const { error: stockError } = await supabase.from("inventory").upsert({ product_id: productId, meters }, { onConflict: "product_id" });
    return stockError ? NextResponse.json({ error: "تعذر تحديث المخزون" }, { status: 503 }) : NextResponse.json({ updated: true });
  }
  if (["publish", "unpublish"].includes(action)) {
    const { error: statusError } = await supabase.from("fabric_products").update({ active: action === "publish" }).eq("id", productId);
    return statusError ? NextResponse.json({ error: "تعذر تحديث حالة النشر" }, { status: 503 }) : NextResponse.json({ updated: true, active: action === "publish" });
  }
  if (action === "verify" || action === "unverify") {
    if (role !== "admin") return NextResponse.json({ error: "توثيق المنتجات متاح للإدارة فقط" }, { status: 403 });
    const { error: verifyError } = await supabase.from("fabric_products").update({ verified: action === "verify" }).eq("id", productId);
    return verifyError ? NextResponse.json({ error: "تعذر تحديث التوثيق" }, { status: 503 }) : NextResponse.json({ updated: true, verified: action === "verify" });
  }
  const product = parseBody(body);
  if (!product) return NextResponse.json({ error: "بيانات المنتج غير صالحة" }, { status: 400 });
  const { error: updateError } = await supabase.from("fabric_products").update({ name_ar: product.name_ar, slug: product.slug, fabric_type: product.fabric_type, price_egp: product.price_egp, width_cm: product.width_cm, colors: product.colors, note: product.note, feel: product.feel, image_url: product.image_url }).eq("id", productId);
  if (updateError) return NextResponse.json({ error: "تعذر تحديث المنتج" }, { status: 503 });
  const { error: stockError } = await supabase.from("inventory").upsert({ product_id: productId, meters: product.meters }, { onConflict: "product_id" });
  if (stockError) return NextResponse.json({ error: "تم تحديث المنتج لكن تعذر تحديث المخزون" }, { status: 503 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(request: Request) {
  const { supabase, error } = await merchantContext();
  if (error) return error;
  const body = await request.json().catch(() => null) as { productId?: string } | null;
  if (typeof body?.productId !== "string" || !body.productId) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 });
  const { error: updateError } = await supabase.from("fabric_products").update({ active: false }).eq("id", body.productId);
  if (updateError) return NextResponse.json({ error: "تعذر إيقاف المنتج" }, { status: 503 });
  return NextResponse.json({ deactivated: true });
}
