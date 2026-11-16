"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Star } from "lucide-react";

type Review = { id: string; rating: number; body: string; created_at: string };
export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`).then((response) => response.ok ? response.json() : null).then((payload: { data?: Review[] } | null) => { setReviews(payload?.data || []); setLoading(false); }).catch(() => setLoading(false)); }, [productId]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setMessage(""); const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, rating, body }) }); const payload = await response.json().catch(() => ({})); setMessage(response.ok ? payload.message : payload.error || "تعذر حفظ المراجعة"); if (response.ok) setBody(""); };
  return <section className="product-reviews"><div className="product-reviews-head"><div><p className="eyebrow">تجارب حقيقية</p><h2>مراجعات العميلات</h2></div><MessageCircle aria-hidden="true" /></div>{loading ? <p className="form-muted">بنحمّل المراجعات...</p> : reviews.length ? <div className="review-list">{reviews.map((review) => <article key={review.id}><div className="review-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden="true" fill={index < review.rating ? "currentColor" : "none"} />)}</div><p>{review.body}</p><small>{new Date(review.created_at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</small></article>)}</div> : <div className="reviews-empty"><p>لسه مفيش مراجعات منشورة لهذا القماش.</p><small>بعد استلام طلبك تقدري تكتبي تجربتك.</small></div>}<form className="review-form" onSubmit={submit}><strong>استلمتي القماش؟ شاركينا تجربتك</strong><div className="review-rating" aria-label="اختاري التقييم">{Array.from({ length: 5 }, (_, index) => <button type="button" key={index} className={index < rating ? "active" : ""} onClick={() => setRating(index + 1)} aria-label={`${index + 1} نجوم`}><Star aria-hidden="true" fill={index < rating ? "currentColor" : "none"} /></button>)}</div><textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={5} maxLength={1000} placeholder="اكتبي ملاحظتك بعد الاستلام..." required />{message && <p className="form-success-inline" role="status">{message}</p>}<button className="primary" type="submit">إرسال للمراجعة</button></form></section>;
}
