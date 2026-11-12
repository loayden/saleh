"use client";

import { useState } from "react";

type Order = { id: string; status: string; city: string; subtotal_egp: number | string; created_at: string };
type Request = { id: string; status: string; customer_name: string | null; garment_type: string | null; city: string | null; tailoring_price_egp: number | string | null; created_at: string };

const orderStatuses = [["new", "جديد"], ["confirmed", "مؤكد"], ["preparing", "قيد التجهيز"], ["handed_to_carrier", "مع شركة التوصيل"], ["in_transit", "في الطريق"], ["delivered", "تم التسليم"], ["cancelled", "ملغي"], ["returned", "مرتجع"]];
const requestStatuses = [["new", "جديد"], ["reviewing", "قيد المراجعة"], ["quoted", "تم التسعير"], ["accepted", "مقبول"], ["in_progress", "قيد التنفيذ"], ["completed", "مكتمل"], ["cancelled", "ملغي"]];

export default function MerchantOperations({ orders: initialOrders, requests: initialRequests }: { orders: Order[]; requests: Request[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [requests, setRequests] = useState(initialRequests);
  const [message, setMessage] = useState("");
  const updateOrder = async (orderId: string, status: string) => {
    const response = await fetch("/api/merchant/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId, status }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(payload.error || "تعذر تحديث الطلب"); return; }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order)); setMessage("تم تحديث حالة الطلب.");
  };
  const updateRequest = async (requestId: string, status: string, tailoringPrice: number | null) => {
    const response = await fetch("/api/merchant/tailoring-requests", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId, status, tailoringPrice }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(payload.error || "تعذر تحديث طلب التفصيل"); return; }
    setRequests((current) => current.map((item) => item.id === requestId ? { ...item, status, tailoring_price_egp: tailoringPrice } : item)); setMessage("تم تحديث طلب التفصيل.");
  };
  return <><div className="dashboard-panel merchant-operations" id="orders"><div className="panel-head"><div><p className="eyebrow">الطلبات الحقيقية</p><h2>متابعة الطلبات</h2></div></div>{orders.length ? <div className="dashboard-table-wrap"><table><thead><tr><th>الطلب</th><th>المدينة</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>#{order.id.slice(0, 8)}</strong><small className="table-slug">{new Date(order.created_at).toLocaleDateString("ar-EG")}</small></td><td>{order.city}</td><td>{Number(order.subtotal_egp).toLocaleString("ar-EG")} ج.م</td><td><select value={order.status} onChange={(event) => void updateOrder(order.id, event.target.value)} aria-label={`حالة الطلب ${order.id.slice(0, 8)}`}>{orderStatuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div> : <div className="dashboard-empty"><p>لا توجد طلبات حقيقية بعد.</p></div>}</div><div className="dashboard-panel merchant-operations" id="requests"><div className="panel-head"><div><p className="eyebrow">طلبات التفصيل</p><h2>مراجعة وتسعير الطلبات</h2></div></div>{requests.length ? <div className="dashboard-table-wrap"><table><thead><tr><th>العميلة</th><th>القطعة</th><th>السعر</th><th>الحالة</th></tr></thead><tbody>{requests.map((item) => <tr key={item.id}><td><strong>{item.customer_name || "بدون اسم"}</strong><small className="table-slug">{item.city || ""}</small></td><td>{item.garment_type || "قطعة مخصصة"}</td><td><input className="merchant-price-input" type="number" min="0" step="1" defaultValue={item.tailoring_price_egp == null ? "" : Number(item.tailoring_price_egp)} aria-label={`سعر التفصيل ${item.id.slice(0, 8)}`} onBlur={(event) => void updateRequest(item.id, item.status, event.target.value ? Number(event.target.value) : null)} /></td><td><select value={item.status} onChange={(event) => void updateRequest(item.id, event.target.value, item.tailoring_price_egp == null ? null : Number(item.tailoring_price_egp))} aria-label={`حالة طلب التفصيل ${item.id.slice(0, 8)}`}>{requestStatuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div> : <div className="dashboard-empty"><p>لا توجد طلبات تفصيل حقيقية بعد.</p></div>}</div>{message && <p className="dashboard-toast" role="status">{message}</p>}</>;
}
