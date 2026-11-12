import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { analyticsEvents } from "@/lib/analytics";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { event?: string; properties?: Record<string, unknown> } | null;
  if (!body || !analyticsEvents.includes(body.event as typeof analyticsEvents[number])) return NextResponse.json({ error: "حدث غير مسموح" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("analytics_events").insert({ user_id: user?.id || null, event_name: body.event, properties: body.properties || {} });
  if (error) return NextResponse.json({ error: "تعذر حفظ الحدث" }, { status: 503 });
  return NextResponse.json({ accepted: true, persisted: true });
}
