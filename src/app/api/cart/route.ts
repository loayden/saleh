import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ProductRow = { id: string; slug: string; name_ar: string; fabric_type: string; price_egp: number | string; width_cm: number | null; image_url: string | null; inventory: { meters: number | string }[] | { meters: number | string } | null };

async function getContext() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function mapCartItem(item: { id: string; product_id: string; meters: number | string; color: string; fabric_products: ProductRow | ProductRow[] | null }) {
  const product = Array.isArray(item.fabric_products) ? item.fabric_products[0] : item.fabric_products;
  const inventory = product && (Array.isArray(product.inventory) ? product.inventory[0] : product.inventory);
  if (!product) return null;
  return { id: product.id, slug: product.slug, name: product.name_ar, type: product.fabric_type, price: Number(product.price_egp), stock: Number(inventory?.meters || 0), width: product.width_cm, image: product.image_url || null, color: item.color || "", meters: Number(item.meters), cartItemId: item.id };
}

async function getCart(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data: cart, error: cartError } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (cartError) throw cartError;
  if (!cart) return [];
  const { data, error } = await supabase.from("cart_items").select("id,product_id,meters,color,fabric_products(id,slug,name_ar,fabric_type,price_egp,width_cm,image_url,inventory(meters))").eq("cart_id", cart.id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((item) => mapCartItem(item as never)).filter(Boolean);
}

async function getOrCreateCart(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data, error } = await supabase.from("carts").upsert({ user_id: userId }, { onConflict: "user_id" }).select("id").single();
  if (error || !data) throw error || new Error("cart unavailable");
  return data.id;
}

export async function GET() {
  const { supabase, user } = await getContext();
  if (!user) return NextResponse.json({ data: [], authenticated: false, meta: { live: true, count: 0 } });
  try {
    const data = await getCart(supabase, user.id);
    return NextResponse.json({ data, authenticated: true, meta: { live: true, count: data.length } });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل السلة" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getContext();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { productId?: string; meters?: number; color?: string } | null;
  const meters = Number(body?.meters);
  const color = typeof body?.color === "string" ? body.color.trim().slice(0, 120) : "";
  if (typeof body?.productId !== "string" || !body.productId || !Number.isFinite(meters) || meters <= 0 || meters > 1000) return NextResponse.json({ error: "بيانات السلة غير صالحة" }, { status: 400 });
  const { data: product } = await supabase.from("fabric_products").select("id,inventory(meters)").eq("id", body.productId).eq("active", true).eq("verified", true).maybeSingle();
  const inventory = product && (Array.isArray(product.inventory) ? product.inventory[0] : product.inventory);
  const stock = Number(inventory?.meters || 0);
  if (!product || stock <= 0) return NextResponse.json({ error: "المنتج غير متاح" }, { status: 409 });
  const cartId = await getOrCreateCart(supabase, user.id);
  const { data: existing } = await supabase.from("cart_items").select("id,meters").eq("cart_id", cartId).eq("product_id", body.productId).eq("color", color).maybeSingle();
  const nextMeters = Number(existing?.meters || 0) + meters;
  if (nextMeters > stock) return NextResponse.json({ error: "الكمية تتجاوز المخزون المتاح" }, { status: 409 });
  const { data, error } = await supabase.from("cart_items").upsert({ id: existing?.id, cart_id: cartId, product_id: body.productId, meters: nextMeters, color }, { onConflict: "cart_id,product_id,color" }).select("id").single();
  if (error) return NextResponse.json({ error: "تعذر حفظ السلة" }, { status: 503 });
  return NextResponse.json({ saved: true, itemId: data.id, meters: nextMeters });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getContext();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { itemId?: string; meters?: number } | null;
  const meters = Number(body?.meters);
  if (typeof body?.itemId !== "string" || !body.itemId || !Number.isFinite(meters) || meters <= 0 || meters > 1000) return NextResponse.json({ error: "بيانات السلة غير صالحة" }, { status: 400 });
  const { data: item } = await supabase.from("cart_items").select("id,product_id,fabric_products(inventory(meters))").eq("id", body.itemId).maybeSingle();
  const product = item?.fabric_products && (Array.isArray(item.fabric_products) ? item.fabric_products[0] : item.fabric_products);
  const inventory = product && (Array.isArray(product.inventory) ? product.inventory[0] : product.inventory);
  if (!item || meters > Number(inventory?.meters || 0)) return NextResponse.json({ error: "الكمية تتجاوز المخزون المتاح" }, { status: 409 });
  const { error } = await supabase.from("cart_items").update({ meters }).eq("id", body.itemId);
  if (error) return NextResponse.json({ error: "تعذر تحديث السلة" }, { status: 503 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getContext();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { itemId?: string; clear?: boolean } | null;
  if (body?.clear) {
    const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
    if (cart) {
      const { error } = await supabase.from("cart_items").delete().eq("cart_id", cart.id);
      if (error) return NextResponse.json({ error: "تعذر تفريغ السلة" }, { status: 503 });
    }
    return NextResponse.json({ cleared: true });
  }
  if (typeof body?.itemId !== "string" || !body.itemId) return NextResponse.json({ error: "عنصر السلة مطلوب" }, { status: 400 });
  const { error } = await supabase.from("cart_items").delete().eq("id", body.itemId);
  if (error) return NextResponse.json({ error: "تعذر حذف العنصر" }, { status: 503 });
  return NextResponse.json({ deleted: true });
}
