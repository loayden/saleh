"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

type Review = { id: string; rating: number; body: string | null; approved: boolean; created_at: string; fabric_products: { name_ar: string } | { name_ar: string }[] | null };
export default function AdminReviewManager({ initial }: { initial: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [message, setMessage] = useState("");
  const update = async (review: Review, approved: boolean) => { const response = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: review.id, approved }) }); const payload = await response.json().catch(() => ({})); if (!response.ok) return setMessage(payload.error || "تعذر تحديث المراجعة"); setReviews((current) => current.map((item) => item.id === review.id ? { ...item, approved } : item)); setMessage(approved ? "تم نشر المراجعة." : "تم إخفاء المراجعة."); };
  return <section className="dashboard-panel"><div className="panel-head"><div><p className="eyebrow">ثقة العميلات</p><h2>مراجعات المنتجات</h2></div></div>{message && <p className="form-success-inline">{message}</p>}{reviews.length ? <div className="admin-review-list">{reviews.map((review) => { const product = Array.isArray(review.fabric_products) ? review.fabric_products[0] : review.fabric_products; return <article key={review.id}><div><strong>{product?.name_ar || "منتج"}</strong><div className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div><p>{review.body || "بدون تعليق"}</p><small>{new Date(review.created_at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</small></div><div className="admin-review-actions"><span className={review.approved ? "status-good" : "status-muted"}>{review.approved ? "منشورة" : "بانتظار المراجعة"}</span><button type="button" onClick={() => void update(review, true)} aria-label="نشر المراجعة"><Check aria-hidden="true" /></button><button type="button" onClick={() => void update(review, false)} aria-label="إخفاء المراجعة"><X aria-hidden="true" /></button></div></article>; })}</div> : <div className="dashboard-empty"><p>لا توجد مراجعات حتى الآن.</p></div>}</section>;
}
