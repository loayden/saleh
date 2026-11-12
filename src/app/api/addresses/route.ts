import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function clientWithUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await clientWithUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { data, error } = await supabase.from("addresses").select("id,city,district,address_line,is_default,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "تعذر تحميل العناوين" }, { status: 503 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await clientWithUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { city?: string; district?: string; addressLine?: string; isDefault?: boolean } | null;
  if (typeof body?.city !== "string" || typeof body.district !== "string" || typeof body.addressLine !== "string" || !body.district.trim() || !body.addressLine.trim() || !["القاهرة", "الإسكندرية"].includes(body.city)) return NextResponse.json({ error: "بيانات العنوان غير مكتملة" }, { status: 400 });
  if (body.isDefault) {
    const { error: resetError } = await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    if (resetError) return NextResponse.json({ error: "تعذر تحديث العنوان الأساسي" }, { status: 503 });
  }
  const { data, error } = await supabase.from("addresses").insert({ user_id: user.id, city: body.city, district: body.district.trim(), address_line: body.addressLine.trim(), is_default: Boolean(body.isDefault) }).select("id,city,district,address_line,is_default,created_at").single();
  if (error) return NextResponse.json({ error: "تعذر حفظ العنوان" }, { status: 503 });
  return NextResponse.json({ address: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await clientWithUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string } | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  const { error } = await supabase.from("addresses").delete().eq("id", body.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "تعذر حذف العنوان" }, { status: 503 });
  return NextResponse.json({ deleted: true });
}
