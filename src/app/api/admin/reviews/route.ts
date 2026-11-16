import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function adminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { supabase, error: NextResponse.json({ error: "صلاحية الإدارة مطلوبة" }, { status: 403 }) };
  return { supabase, error: null };
}

export async function PATCH(request: Request) {
  const { supabase, error } = await adminContext();
  if (error) return error;
  const body = await request.json().catch(() => null) as { reviewId?: unknown; approved?: unknown } | null;
  if (typeof body?.reviewId !== "string" || typeof body.approved !== "boolean") return NextResponse.json({ error: "بيانات المراجعة غير صالحة" }, { status: 400 });
  const { error: updateError } = await supabase.from("reviews").update({ approved: body.approved }).eq("id", body.reviewId);
  if (updateError) return NextResponse.json({ error: "تعذر تحديث المراجعة" }, { status: 503 });
  const { data: actor } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({ actor_id: actor.user?.id || null, action: body.approved ? "review.approved" : "review.rejected", entity_type: "review", entity_id: body.reviewId });
  return NextResponse.json({ updated: true, approved: body.approved });
}
