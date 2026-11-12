import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type PaymobTransaction = {
  id?: number;
  pending?: boolean;
  amount_cents?: number;
  created_at?: string;
  currency?: string;
  success?: boolean;
  is_auth?: boolean;
  is_capture?: boolean;
  is_standalone_payment?: boolean;
  is_voided?: boolean;
  is_refunded?: boolean;
  is_3d_secure?: boolean;
  integration_id?: number;
  has_parent_transaction?: boolean;
  order?: { id?: number; merchant_order_id?: string | null };
  owner?: number;
  source_data?: { pan?: string | null; sub_type?: string | null; type?: string | null };
};

function value(value: unknown) {
  if (typeof value === "boolean") return value ? "true" : "false";
  return value === null || value === undefined ? "" : String(value);
}

function hmacInput(transaction: PaymobTransaction) {
  const source = transaction.source_data || {};
  return [
    transaction.amount_cents,
    transaction.created_at,
    transaction.currency,
    transaction.has_parent_transaction,
    transaction.id,
    transaction.integration_id,
    transaction.is_3d_secure,
    transaction.is_auth,
    transaction.is_capture,
    transaction.is_refunded,
    transaction.is_standalone_payment,
    transaction.is_voided,
    transaction.order?.id,
    transaction.owner,
    transaction.pending,
    source.pan,
    source.sub_type,
    source.type,
    transaction.success,
  ].map(value).join("");
}

function signaturesMatch(transaction: PaymobTransaction, received: string, secret: string) {
  const expected = createHmac("sha512", secret).update(hmacInput(transaction)).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.PAYMOB_HMAC_SECRET || process.env.PAYMOB_WEBHOOK_SECRET;
  const admin = createSupabaseAdminClient();
  if (!secret || !admin) return NextResponse.json({ configured: false, message: "Paymob webhook يحتاج HMAC secret وSUPABASE_SERVICE_ROLE_KEY." }, { status: 501 });
  const body = await request.json().catch(() => null) as { type?: string; obj?: PaymobTransaction } | null;
  const transaction = body?.obj;
  const received = new URL(request.url).searchParams.get("hmac") || "";
  if (body?.type !== "TRANSACTION" || !transaction || !received || !signaturesMatch(transaction, received, secret)) return NextResponse.json({ error: "توقيع Paymob غير صالح" }, { status: 401 });
  const internalOrderId = transaction.order?.merchant_order_id;
  const paymobOrderId = transaction.order?.id;
  let payment: { id: string; order_id: string; provider_reference: string | null; status: string } | null = null;
  if (internalOrderId && /^[0-9a-f-]{36}$/i.test(internalOrderId)) {
    const { data } = await admin.from("payments").select("id,order_id,provider_reference,status").eq("order_id", internalOrderId).eq("provider", "paymob").maybeSingle();
    payment = data;
  }
  if (!payment && paymobOrderId) {
    const { data } = await admin.from("payments").select("id,order_id,provider_reference,status").eq("provider", "paymob").limit(1000);
    payment = (data || []).find((candidate) => candidate.provider_reference?.split(":")[2] === String(paymobOrderId)) || null;
  }
  if (!payment) return NextResponse.json({ error: "طلب Paymob غير معروف" }, { status: 404 });
  const { data: order } = await admin.from("orders").select("id,subtotal_egp,delivery_fee_egp,status").eq("id", payment.order_id).maybeSingle();
  if (!order || Math.round((Number(order.subtotal_egp) + Number(order.delivery_fee_egp)) * 100) !== Number(transaction.amount_cents)) return NextResponse.json({ error: "قيمة الدفع لا تطابق الطلب" }, { status: 409 });
  const status = transaction.success ? "paid" : "failed";
  const { error: paymentError } = await admin.from("payments").update({ status, provider_reference: payment.provider_reference || `paymob:${transaction.id || ""}:${paymobOrderId || ""}` }).eq("id", payment.id).neq("status", "paid");
  if (paymentError) return NextResponse.json({ error: "تعذر تحديث الدفع" }, { status: 503 });
  if (transaction.success) await admin.from("orders").update({ status: "confirmed" }).eq("id", payment.order_id).in("status", ["new", "confirmed"]);
  return NextResponse.json({ received: true });
}
