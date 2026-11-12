import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const startedAt = Date.now();
  const checks = {
    database: false,
    openai: Boolean(process.env.OPENAI_API_KEY),
    paymob: Boolean(process.env.PAYMOB_SECRET_KEY && process.env.PAYMOB_PUBLIC_KEY && process.env.PAYMOB_INTEGRATION_ID && process.env.PAYMOB_HMAC_SECRET),
    delivery: Boolean(process.env.DELIVERY_PROVIDER_BASE_URL && process.env.DELIVERY_PROVIDER_TOKEN),
    observability: Boolean(process.env.OBSERVABILITY_INGEST_URL),
  };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("fabric_products").select("id", { head: true, count: "exact" });
    checks.database = !error;
  } catch {
    checks.database = false;
  }
  const healthy = checks.database;
  return NextResponse.json({ service: "saleh", version: process.env.APP_VERSION || "0.1.0", status: healthy ? "ok" : "degraded", checks, latencyMs: Date.now() - startedAt, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } });
}
