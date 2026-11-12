import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const required = ["customerName", "phone", "city", "district", "addressLine", "heightCm", "fabricColor", "requestedMeters", "garmentType", "details"];
  if (!body || required.some((key) => body[key] === undefined || body[key] === "")) return NextResponse.json({ error: "بيانات طلب التفصيل غير مكتملة" }, { status: 400 });
  const referenceInput = Array.isArray(body.referenceImages) ? body.referenceImages.slice(0, 5) : [];
  if (referenceInput.some((item) => typeof item !== "string")) return NextResponse.json({ error: "صور الإلهام غير صالحة" }, { status: 400 });
  const referenceImages = referenceInput as string[];
  if (referenceImages.reduce((total, image) => total + image.length, 0) > 12_000_000) return NextResponse.json({ error: "إجمالي صور الإلهام أكبر من الحد المسموح" }, { status: 413 });
  const height = Number(body.heightCm), meters = Number(body.requestedMeters);
  if (!Number.isInteger(height) || height < 80 || height > 250 || !Number.isFinite(meters) || meters <= 0) return NextResponse.json({ error: "الطول أو عدد الأمتار غير صالح" }, { status: 400 });
  if (!/^(01)[0-25][0-9]{8}$/.test(String(body.phone))) return NextResponse.json({ error: "رقم الموبايل المصري غير صالح" }, { status: 400 });
  const fabricSlug = body.fabricId ? String(body.fabricId) : null;
  if (fabricSlug) {
    const { data: fabric, error: fabricError } = await supabase
      .from("fabric_products")
      .select("slug")
      .eq("slug", fabricSlug)
      .eq("active", true)
      .eq("verified", true)
      .maybeSingle();
    if (fabricError || !fabric) return NextResponse.json({ error: "القماش المختار لم يعد متاحاً" }, { status: 409 });
  }
  let tailorId: string | null = null;
  if (body.tailorId) {
    const { data: tailor, error: tailorError } = await supabase
      .from("tailors")
      .select("id")
      .eq("id", String(body.tailorId))
      .eq("active", true)
      .eq("verified", true)
      .maybeSingle();
    if (tailorError || !tailor) return NextResponse.json({ error: "الخيّاطة المختارة لم تعد متاحة" }, { status: 409 });
    tailorId = tailor.id;
  }
  const { data, error } = await supabase.from("tailoring_requests").insert({ user_id: user?.id || null, fabric_slug: fabricSlug, tailor_id: tailorId, order_id: null, details: String(body.details), customer_name: String(body.customerName), phone: String(body.phone), whatsapp: body.whatsapp ? String(body.whatsapp) : null, city: String(body.city), district: String(body.district), address_line: String(body.addressLine), height_cm: height, fabric_color: String(body.fabricColor), requested_meters: meters, garment_type: String(body.garmentType), reference_images: referenceImages }).select("id, status, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ request: data }, { status: 201 });
}
