"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearLocalCart, readLocalCart, type CartItem } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";

type PaymentResult = "paid" | "pending" | "failed" | "cod";

export default function CheckoutPage() {
  const params = useSearchParams();
  const slug = params.get("fabric") || "";
  const cartMode = params.get("cart") === "1";
  const returnOrder = params.get("payment") === "return" ? params.get("order") || "" : "";
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymobReady, setPaymobReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "paymob">("cod");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("القاهرة");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(returnOrder);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const configResponse = await fetch("/api/payments/paymob/intention");
        const config = await configResponse.json().catch(() => ({}));
        if (!cancelled) setPaymobReady(config.configured === true);
        if (returnOrder) {
          const response = await fetch(`/api/orders/${returnOrder}`);
          const payload = await response.json().catch(() => ({}));
          const status = payload.data?.payment?.status;
          if (!cancelled) setPaymentResult(status === "paid" ? "paid" : status === "failed" ? "failed" : "pending");
          return;
        }
        if (cartMode) {
          const response = await fetch("/api/cart");
          const payload = await response.json();
          if (payload.authenticated) {
            if (!cancelled) setItems((payload.data || []) as CartItem[]);
          } else if (!cancelled) setItems(readLocalCart());
        } else {
          const response = await fetch("/api/fabrics?available=false");
          const payload = await response.json();
          const found = (payload.data || []).find((item: CartItem) => item.slug === slug);
          if (!cancelled && found) setItems([{ ...found, meters: Math.max(0.5, Number(params.get("meters") || 1)), color: params.get("color") || "" }]);
        }
      } catch {
        if (!cancelled) setMessage("تعذر تحميل بيانات الطلب حالياً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [cartMode, params, returnOrder, slug]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.meters, 0), [items]);
  const delivery = city === "الإسكندرية" ? 60 : 50;
  const total = subtotal + delivery;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    trackEvent("checkout_start", { line_count: items.length, source: cartMode ? "cart" : "product", payment: paymentMethod });
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, city, district, addressLine: address, phone, lines: items.map((item) => ({ product_id: item.id, meters: item.meters, color: item.color })) }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSubmitting(false);
      setMessage(response.status === 401 ? "سجّلي الدخول أولاً عشان نقدر نحفظ الطلب ونحجز الكمية." : data.error || "تعذر حفظ الطلب حالياً");
      return;
    }
    const createdOrderId = data.orderId || "";
    await fetch("/api/cart", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ clear: true }) }).catch(() => undefined);
    clearLocalCart();
    if (paymentMethod === "paymob") {
      const paymentResponse = await fetch("/api/payments/paymob/intention", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: createdOrderId }) });
      const payment = await paymentResponse.json().catch(() => ({}));
      if (paymentResponse.ok && payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }
      setOrderId(createdOrderId);
      setPaymentResult("failed");
      setMessage(payment.error || "تم حفظ الطلب، لكن تعذر بدء الدفع الإلكتروني. يمكنك متابعة الطلب أو التواصل معنا.");
    } else {
      setOrderId(createdOrderId);
      setPaymentResult("cod");
      trackEvent("order_completed", { order_id: createdOrderId, payment: "cod" });
    }
    setSubmitting(false);
  };

  if (loading) return <main dir="rtl" className="route-state"><span className="route-spinner" /><p>بنجهّز صفحة الدفع...</p></main>;
  if (returnOrder && orderId) return <main dir="rtl" className="checkout-page"><nav className="simple-nav"><Link href="/">صَالِح</Link><Link href="/orders">طلباتي ←</Link></nav><div className="checkout-success"><span>{paymentResult === "paid" ? "✓" : "!"}</span><h1>{paymentResult === "paid" ? "تم تأكيد الدفع" : paymentResult === "failed" ? "الدفع لم يكتمل" : "الدفع قيد المراجعة"}</h1><p>رقم الطلب: {orderId}</p><Link className="primary" href="/orders">متابعة الطلب ←</Link></div></main>;
  if (orderId) return <main dir="rtl" className="checkout-page"><nav className="simple-nav"><Link href="/">صَالِح</Link><Link href="/cart">← العودة للسلة</Link></nav><div className="checkout-success"><span>{paymentResult === "failed" ? "!" : "✓"}</span><h1>{paymentResult === "failed" ? "الطلب محفوظ والدفع يحتاج متابعة" : "تم تسجيل طلبك"}</h1><p>رقم الطلب: {orderId}</p>{message && <p className="form-error">{message}</p>}<Link className="primary" href="/orders">متابعة الطلب ←</Link></div></main>;
  if (!items.length) return <main dir="rtl" className="route-state"><h1>لا توجد اختيارات للطلب</h1><p>{message || "أضيفي قماشاً من صفحة التفاصيل أو السلة قبل إتمام الطلب."}</p><Link className="primary" href="/shop">العودة للمتجر ←</Link></main>;

  return <main dir="rtl" className="checkout-page"><nav className="simple-nav"><Link href="/">صَالِح</Link><Link href="/cart">← العودة للسلة</Link></nav><section className="checkout-layout"><form className="checkout-form" onSubmit={submit}><p className="eyebrow">إتمام الطلب</p><h1>بيانات التوصيل</h1><p className="form-muted">أدخلي بياناتك كما هي لتأكيد الطلب وحجز الكمية من المخزون.</p><label>الاسم الكامل<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label><label>رقم الموبايل<input required value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="01xxxxxxxxx" autoComplete="tel" /></label><div className="checkout-row"><label>المحافظة<select value={city} onChange={(event) => setCity(event.target.value)}><option>القاهرة</option><option>الإسكندرية</option></select></label><label>المنطقة<input required value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="مثال: سموحة" /></label></div><label>العنوان بالتفصيل<input required value={address} onChange={(event) => setAddress(event.target.value)} placeholder="الشارع، رقم العقار، الدور" autoComplete="street-address" /></label><fieldset className="payment-choice"><legend>طريقة الدفع</legend><label className="payment-option"><input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /> <span><strong>الدفع عند الاستلام</strong><small>يتم حجز الكمية الآن وتدفعين عند وصول الطلب.</small></span></label>{paymobReady ? <label className="payment-option"><input type="radio" name="payment" checked={paymentMethod === "paymob"} onChange={() => setPaymentMethod("paymob")} /> <span><strong>بطاقة أو محفظة عبر Paymob</strong><small>ستنتقلين إلى صفحة Paymob الآمنة بعد حفظ الطلب.</small></span></label> : <small className="payment-setup-note">الدفع الإلكتروني غير متاح حالياً؛ يمكنك إكمال الطلب بالدفع عند الاستلام.</small>}</fieldset>{message && <p className="form-error">{message} {message.startsWith("سجّلي") && <Link href="/auth?next=/checkout">تسجيل الدخول ←</Link>}</p>}<button className="primary full-button" disabled={submitting} type="submit">{submitting ? "جاري حفظ الطلب..." : paymentMethod === "paymob" ? "حفظ الطلب والانتقال للدفع ←" : "تأكيد الطلب والدفع عند الاستلام ←"}</button></form><aside className="checkout-summary-card"><p className="eyebrow">ملخص الطلب</p>{items.map((item) => <div className="checkout-summary-line" key={item.cartItemId || `${item.id}-${item.color}`}><div>{item.image ? <img src={item.image} alt={item.name} /> : <div className="catalog-image-empty checkout-image-empty"><span>{item.type}</span></div>}</div><div><h2>{item.name}</h2><p>{item.color || "اللون يحدد مع التاجر"} · {item.meters} متر</p><strong>{(item.price * item.meters).toLocaleString("ar-EG")} ج.م</strong></div></div>)}<div><span>الإجمالي قبل التوصيل</span><strong>{subtotal.toLocaleString("ar-EG")} ج.م</strong></div><div><span>التوصيل</span><strong>{delivery.toLocaleString("ar-EG")} ج.م</strong></div><div className="checkout-summary"><span>الإجمالي</span><strong>{total.toLocaleString("ar-EG")} ج.م</strong></div></aside></section></main>;
}
