import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { code?: unknown; subtotal?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim().slice(0, 80) : "";
  const subtotal = Number(body?.subtotal);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) return NextResponse.json({ error: "الكود أو الإجمالي غير صالح" }, { status: 400 });
  const { data, error } = await supabase.rpc("validate_coupon", { p_code: code, p_subtotal: subtotal });
  if (error) return NextResponse.json({ error: "تعذر التحقق من الكوبون" }, { status: 503 });
  const result = data as { valid?: boolean; discount?: number; code?: string };
  if (!result.valid) return NextResponse.json({ error: "الكوبون غير صالح أو انتهت صلاحيته" }, { status: 409 });
  return NextResponse.json({ valid: true, code: result.code, discount: Number(result.discount || 0) });
}
