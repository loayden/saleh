import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (request.nextUrl.search.length > 300) return NextResponse.json({ error: "معايير البحث طويلة جداً" }, { status: 400 });
  const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase() || "";
  const type = request.nextUrl.searchParams.get("type") || "";
  const availableOnly = request.nextUrl.searchParams.get("available") !== "false";
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("fabric_products").select("id,slug,name_ar,fabric_type,price_egp,width_cm,verified,active,image_url,colors,note,feel,inventory(meters)").eq("active", true).eq("verified", true).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    const results = (data || []).map((fabric) => {
      const inventory = Array.isArray(fabric.inventory) ? fabric.inventory[0] : fabric.inventory;
      return { id: fabric.id, slug: fabric.slug, name: fabric.name_ar, type: fabric.fabric_type, price: Number(fabric.price_egp), stock: Number(inventory?.meters || 0), width: fabric.width_cm, image: fabric.image_url || null, colors: Array.isArray(fabric.colors) ? fabric.colors : [], note: fabric.note || null, feel: fabric.feel || null, verified: Boolean(fabric.verified) };
    }).filter((fabric) => {
      const matchesQuery = !query || `${fabric.name} ${fabric.type}`.toLowerCase().includes(query);
      const matchesType = !type || fabric.type === type;
      const matchesAvailability = !availableOnly || fabric.stock > 0;
      return matchesQuery && matchesType && matchesAvailability;
    });
    return NextResponse.json({ data: results, meta: { live: true, count: results.length } });
  } catch {
    return NextResponse.json({ data: [], meta: { live: false, count: 0 }, error: "تعذر الوصول إلى كتالوج المنتجات" }, { status: 503 });
  }
}
