import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type OrderItem = {
  meters: number | string;
  unit_price_egp: number | string;
  fabric_products: { name_ar: string } | { name_ar: string }[] | null;
};

function isConfigured() {
  return Boolean(
    (process.env.PAYMOB_SECRET_KEY || process.env.PAYMOB_API_KEY) &&
      Number.isInteger(Number(process.env.PAYMOB_INTEGRATION_ID)) &&
      process.env.PAYMOB_PUBLIC_KEY &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );
}

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] || null : value;
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYMOB_SECRET_KEY || process.env.PAYMOB_API_KEY;
  const integrationId = Number(process.env.PAYMOB_INTEGRATION_ID);
  const baseUrl = (process.env.PAYMOB_BASE_URL || "https://accept.paymob.com").replace(/\/$/, "");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (!isConfigured() || !secretKey || !Number.isInteger(integrationId) || !siteUrl) {
    return NextResponse.json({ configured: false, error: "الدفع الإلكتروني غير مهيأ بعد." }, { status: 501 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });
  const body = await request.json().catch(() => null) as { orderId?: string } | null;
  if (!body?.orderId || !/^[0-9a-f-]{36}$/i.test(body.orderId)) return NextResponse.json({ error: "رقم الطلب غير صالح" }, { status: 400 });

  const [{ data: order, error: orderError }, { data: payment, error: paymentError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("orders").select("id,user_id,city,district,address_line,phone,subtotal_egp,delivery_fee_egp,status").eq("id", body.orderId).eq("user_id", user.id).maybeSingle(),
    supabase.from("payments").select("id,provider,status").eq("order_id", body.orderId).maybeSingle(),
    supabase.from("order_items").select("meters,unit_price_egp,fabric_products(name_ar)").eq("order_id", body.orderId),
  ]);
  if (orderError || paymentError || itemsError || !order || !payment) return NextResponse.json({ error: "الطلب غير متاح للدفع" }, { status: 404 });
  if (payment.status === "paid") return NextResponse.json({ error: "تم دفع هذا الطلب بالفعل" }, { status: 409 });
  if (order.status !== "new") return NextResponse.json({ error: "لا يمكن بدء الدفع لهذا الطلب الآن" }, { status: 409 });

  const totalCents = Math.round((Number(order.subtotal_egp) + Number(order.delivery_fee_egp)) * 100);
  if (!Number.isInteger(totalCents) || totalCents <= 0 || !items?.length) return NextResponse.json({ error: "إجمالي الطلب غير صالح" }, { status: 409 });
  const callbackUrl = `${siteUrl}/api/payments/paymob/webhook`;
  const returnUrl = `${siteUrl}/checkout?payment=return&order=${encodeURIComponent(order.id)}`;
  const response = await fetch(`${baseUrl}/v1/intention/`, {
    method: "POST",
    headers: { Authorization: `Token ${secretKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      amount: totalCents,
      currency: "EGP",
      payment_methods: [integrationId],
      items: (items as OrderItem[]).map((item) => {
        const product = first(item.fabric_products);
        return { name: product?.name_ar || "قماش من صَالِح", amount: Math.round(Number(item.unit_price_egp) * 100), description: `${Number(item.meters)} متر`, quantity: 1 };
      }),
      billing_data: {
        apartment: "",
        first_name: user.user_metadata?.full_name || "عميلة",
        last_name: "صَالِح",
        street: order.address_line,
        building: order.district,
        phone_number: order.phone.startsWith("+2") ? order.phone : `+2${order.phone}`,
        city: order.city,
        country: "EG",
        email: user.email || "",
        floor: "",
        state: order.city,
      },
      special_reference: order.id,
      expiration: 3600,
      notification_url: callbackUrl,
      redirection_url: returnUrl,
    }),
  });
  const payload = await response.json().catch(() => null) as { id?: string; client_secret?: string; intention_order_id?: number } | null;
  if (!response.ok || !payload?.client_secret) return NextResponse.json({ error: "تعذر بدء الدفع الإلكتروني من Paymob" }, { status: 502 });
  const providerReference = [order.id, payload.id || "", payload.intention_order_id || ""].join(":");
  const { error: updateError } = await supabase.from("payments").update({ provider: "paymob", provider_reference: providerReference }).eq("id", payment.id).eq("order_id", order.id);
  if (updateError) return NextResponse.json({ error: "تعذر حفظ مرجع الدفع" }, { status: 503 });
  return NextResponse.json({ configured: true, clientSecret: payload.client_secret, checkoutUrl: `${baseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(process.env.PAYMOB_PUBLIC_KEY || "")}&clientSecret=${encodeURIComponent(payload.client_secret)}` });
}

export async function GET() {
  return NextResponse.json({ configured: isConfigured() });
}
