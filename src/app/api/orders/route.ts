import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string; city?: string; district?: string; addressLine?: string; phone?: string; lines?: { product_id: string; meters: number; color?: string }[] } | null;
  if (typeof body?.name !== "string" || !body.name.trim() || typeof body.city !== "string" || typeof body.district !== "string" || !body.district.trim() || typeof body.addressLine !== "string" || !body.addressLine.trim() || typeof body.phone !== "string" || !Array.isArray(body.lines)) return NextResponse.json({ error: "بيانات الطلب غير مكتملة" }, { status: 400 });
  const validLines = body.lines.every((line) => line && typeof line === "object" && typeof line.product_id === "string" && line.product_id.length > 0 && Number.isFinite(Number(line.meters)) && Number(line.meters) > 0);
  if (!["القاهرة", "الإسكندرية"].includes(body.city) || !/^(01)[0-25][0-9]{8}$/.test(body.phone) || body.lines.length === 0 || body.lines.length > 50 || !validLines) return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  const { data, error } = await supabase.rpc("create_order_with_reservation", { p_city: body.city, p_district: body.district, p_address_line: body.addressLine, p_phone: body.phone, p_lines: body.lines });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  await supabase.from("profiles").update({ full_name: body.name.trim(), phone: body.phone }).eq("id", user.id);
  return NextResponse.json({ orderId: data }, { status: 201 });
}
