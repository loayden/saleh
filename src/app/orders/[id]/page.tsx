import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleAlert, PackageCheck, Truck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";

const statusLabels: Record<string, string> = {
  new: "تم استلام الطلب",
  confirmed: "تم تأكيد الطلب",
  preparing: "بنجهز طلبك",
  handed_to_carrier: "اتسلّم لشركة التوصيل",
  in_transit: "الطلب في الطريق",
  delivered: "تم التسليم",
  cancelled: "تم إلغاء الطلب",
  returned: "تم إرجاع الطلب",
};

const dateLabel = (value: string) => new Date(value).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" });

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next={`/orders/${id}`} />;
  const { data: order, error } = await supabase.from("orders").select("id,status,subtotal_egp,delivery_fee_egp,city,district,address_line,phone,created_at,payments(status,provider,provider_reference),deliveries(status,provider,tracking_reference),order_items(id,meters,unit_price_egp,color,fabric_products(name_ar,slug,fabric_type,image_url)),order_status_events(id,status,note,created_at)").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !order) notFound();
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  const delivery = Array.isArray(order.deliveries) ? order.deliveries[0] : order.deliveries;
  const events = (Array.isArray(order.order_status_events) ? order.order_status_events : []).sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const timeline = events.length ? events : [{ id: "current", status: order.status, created_at: order.created_at, note: null }];
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const total = Number(order.subtotal_egp) + Number(order.delivery_fee_egp);

  return <main dir="rtl" className="order-detail-page"><header className="order-detail-header"><Link href="/orders" className="back-link"><ArrowRight aria-hidden="true" /> طلباتي</Link><p className="eyebrow">مساحتي / تتبع الطلب</p><h1>طلب #{order.id.slice(0, 8)}</h1><p>اتعمل يوم {dateLabel(order.created_at)}</p></header><section className="order-detail-content"><div className="order-status-card"><div className="order-status-card-head"><div><p className="eyebrow">الحالة الحالية</p><h2>{statusLabels[order.status] || order.status}</h2></div><PackageCheck aria-hidden="true" /></div><div className="order-timeline">{timeline.map((event: { id: string; status: string; created_at: string; note?: string | null }, index: number) => <div className={`order-timeline-event ${index === timeline.length - 1 ? "current" : ""}`} key={event.id}><span className="order-timeline-icon">{event.status === "in_transit" ? <Truck aria-hidden="true" /> : event.status === "delivered" ? <CheckCircle2 aria-hidden="true" /> : <span>{index + 1}</span>}</span><div><strong>{statusLabels[event.status] || event.status}</strong><small>{dateLabel(event.created_at)}</small>{event.note && <p>{event.note}</p>}</div></div>)}</div>{order.status === "delivered" && <div className="order-help-note"><CheckCircle2 aria-hidden="true" /><span>وصل طلبك؟ تقدري ترجعي لنا لو فيه أي ملاحظة على القماش أو التوصيل.</span></div>}{["cancelled", "returned"].includes(order.status) && <div className="order-help-note warning"><CircleAlert aria-hidden="true" /><span>لو محتاجة مساعدة في الطلب، تواصلي مع فريق صَالِح من صفحة الدعم.</span></div>}</div><div className="order-detail-grid"><section className="order-detail-panel"><div className="panel-head"><div><p className="eyebrow">المحتويات</p><h2>الأقمشة المختارة</h2></div></div><div className="order-line-list">{items.map((item: { id: string; meters: number | string; unit_price_egp: number | string; color: string | null; fabric_products: { name_ar: string; slug: string; fabric_type: string; image_url: string | null } | { name_ar: string; slug: string; fabric_type: string; image_url: string | null }[] | null }) => { const product = Array.isArray(item.fabric_products) ? item.fabric_products[0] : item.fabric_products; return <article key={item.id}><div className="order-line-image">{product?.image_url ? <img src={product.image_url} alt={product.name_ar} /> : <span>{product?.fabric_type || "قماش"}</span>}</div><div><strong>{product?.name_ar || "منتج"}</strong><p>{product?.fabric_type || ""}{item.color ? ` · ${item.color}` : ""}</p><small>{item.meters} متر × {Number(item.unit_price_egp).toLocaleString("ar-EG")} ج.م</small></div><b>{(Number(item.meters) * Number(item.unit_price_egp)).toLocaleString("ar-EG")} ج.م</b></article>; })}</div></section><aside className="order-detail-panel"><p className="eyebrow">التوصيل والدفع</p><h2>ملخص الطلب</h2><div className="order-info-list"><span><b>العنوان</b>{order.city}، {order.district}<br />{order.address_line}</span><span><b>رقم الموبايل</b>{order.phone}</span><span><b>طريقة الدفع</b>{payment?.provider === "paymob" ? "الدفع الإلكتروني" : "الدفع عند الاستلام"} · {payment?.status || "pending"}</span>{delivery?.tracking_reference && <span><b>رقم التتبع</b>{delivery.tracking_reference}</span>}</div><div className="order-total-lines"><span>الأقمشة <b>{Number(order.subtotal_egp).toLocaleString("ar-EG")} ج.م</b></span><span>التوصيل <b>{Number(order.delivery_fee_egp).toLocaleString("ar-EG")} ج.م</b></span><strong>الإجمالي <b>{total.toLocaleString("ar-EG")} ج.م</b></strong></div></aside></div><Link href="/shop" className="text-button order-continue">مواصلة التسوق <ArrowRight aria-hidden="true" /></Link></section></main>;
}
