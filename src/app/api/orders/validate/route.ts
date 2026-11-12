import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type OrderLine = { fabricId: string; meters: number };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { city?: string; lines?: OrderLine[] } | null;
  if (!body || !["القاهرة", "الإسكندرية"].includes(body.city || "") || !Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 50) {
    return NextResponse.json({ error: "بيانات الطلب غير مكتملة" }, { status: 400 });
  }
  if (!body.lines.every((line) => line && typeof line === "object" && typeof line.fabricId === "string" && line.fabricId.length > 0 && Number.isFinite(Number(line.meters)) && Number(line.meters) > 0)) {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  }
  const issues: string[] = [];
  let subtotal = 0;
  const supabase = await createSupabaseServerClient();
  for (const line of body.lines) {
    const { data: fabric } = await supabase.from("fabric_products").select("id,name_ar,price_egp,inventory(meters)").eq("slug", line.fabricId).eq("active", true).eq("verified", true).maybeSingle();
    const inventory = fabric && (Array.isArray(fabric.inventory) ? fabric.inventory[0] : fabric.inventory);
    const stock = Number(inventory?.meters || 0);
    if (!fabric) { issues.push(`القماش ${line.fabricId} غير موجود`); continue; }
    if (!Number.isFinite(Number(line.meters)) || Number(line.meters) <= 0) { issues.push(`كمية غير صالحة لـ ${fabric.name_ar}`); continue; }
    if (line.meters > stock) { issues.push(`الكمية المطلوبة من ${fabric.name_ar} أكبر من المتاح`); continue; }
    subtotal += Number(fabric.price_egp) * line.meters;
  }
  return NextResponse.json({ valid: issues.length === 0, issues, subtotal, deliveryFee: null, meta: { live: true, stockReservation: false } }, { status: issues.length ? 409 : 200 });
}
