import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type MeasurementBody = { name?: unknown; measurements?: unknown; notes?: unknown };

async function context() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function parse(body: MeasurementBody | null) {
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const source = body?.measurements && typeof body.measurements === "object" && !Array.isArray(body.measurements) ? body.measurements as Record<string, unknown> : {};
  const measurements = Object.fromEntries(Object.entries(source).slice(0, 20).map(([key, value]) => [key.trim().slice(0, 40), String(value).trim().slice(0, 20)]).filter(([key, value]) => key && value));
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 500) : null;
  if (!name || Object.keys(measurements).length === 0) return null;
  return { name, measurements, notes };
}

export async function GET() {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const { data, error } = await supabase.from("measurement_profiles").select("id,name,measurements,notes,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "تعذر تحميل المقاسات" }, { status: 503 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const parsed = parse(await request.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "أضيفي اسم المقاس وقيمة واحدة على الأقل" }, { status: 400 });
  const { data, error } = await supabase.from("measurement_profiles").insert({ user_id: user.id, ...parsed }).select("id,name,measurements,notes,created_at,updated_at").single();
  if (error) return NextResponse.json({ error: "تعذر حفظ المقاسات" }, { status: 503 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as (MeasurementBody & { id?: unknown }) | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ملف المقاسات مطلوب" }, { status: 400 });
  const parsed = parse(body);
  if (!parsed) return NextResponse.json({ error: "أضيفي اسم المقاس وقيمة واحدة على الأقل" }, { status: 400 });
  const { data, error } = await supabase.from("measurement_profiles").update(parsed).eq("id", body.id).eq("user_id", user.id).select("id,name,measurements,notes,created_at,updated_at").single();
  if (error || !data) return NextResponse.json({ error: "تعذر تحديث المقاسات" }, { status: 503 });
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await context();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: unknown } | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ملف المقاسات مطلوب" }, { status: 400 });
  const { error } = await supabase.from("measurement_profiles").delete().eq("id", body.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "تعذر حذف المقاسات" }, { status: 503 });
  return NextResponse.json({ deleted: true });
}
