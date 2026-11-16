"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Share2, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { addLocalCartItem, type CartProductInput } from "@/lib/cart";
import ProductReviews from "@/components/product-reviews";

type LiveFabric = { id: string; slug: string; name: string; type: string; price: number; salePrice: number | null; stock: number; width: number | null; image: string | null; colors: string[]; note: string | null; feel: string | null; material: string | null; weight: number | null; care: string | null; deliveryNote: string | null; verified: boolean };

export default function FabricProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [fabric, setFabric] = useState<LiveFabric | null>(null);
  const [loading, setLoading] = useState(true);
  const [meters, setMeters] = useState(1);
  const [color, setColor] = useState("");
  const [nextStep, setNextStep] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fabrics?available=false").then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog"))).then((payload: { data?: LiveFabric[] }) => {
      if (cancelled) return;
      const found = (payload.data || []).find((item) => item.slug === slug) || null;
      setFabric(found); setColor(found?.colors?.[0] || ""); setLoading(false);
      if (found) {
        const viewed = JSON.parse(window.localStorage.getItem("saleh-recently-viewed") || "[]") as string[];
        window.localStorage.setItem("saleh-recently-viewed", JSON.stringify([found.slug, ...viewed.filter((item) => item !== found.slug)].slice(0, 12)));
        void fetch("/api/wishlist").then((response) => response.ok ? response.json() : null).then((wishlist: { data?: { product_id: string }[] } | null) => setSaved(Boolean(wishlist?.data?.some((item) => item.product_id === found.id))));
      }
    }).catch(() => { if (!cancelled) { setFabric(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <main dir="rtl" className="route-state"><span className="route-spinner" /><p>بنحمّل تفاصيل المنتج...</p></main>;
  if (!fabric) return <main dir="rtl" className="route-state"><h1>المنتج غير متاح</h1><p>هذا المنتج غير موجود في الكتالوج الحالي أو لم يعد متاحاً.</p><Link className="primary" href="/shop">العودة للمتجر ←</Link></main>;
  const unitPrice = fabric.salePrice ?? fabric.price;
  const total = meters * unitPrice;
  const outOfStock = fabric.stock <= 0;

  const toggleFavorite = async () => {
    setBusyAction("favorite"); setMessage("");
    const response = await fetch("/api/wishlist", { method: saved ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: fabric.id }) });
    const data = await response.json().catch(() => ({}));
    setBusyAction("");
    if (response.status === 401) return setMessage("سجّلي الدخول عشان تحفظي القماش في المفضلة.");
    if (!response.ok) return setMessage(data.error || "تعذر تحديث المفضلة");
    setSaved(!saved); setMessage(saved ? "اتشال القماش من المفضلة." : "اتحفظ القماش في المفضلة.");
  };

  const requestSample = async () => {
    setBusyAction("sample"); setMessage("");
    const response = await fetch("/api/sample-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: fabric.id, color }) });
    const data = await response.json().catch(() => ({})); setBusyAction("");
    setMessage(response.ok ? "اتسجل طلب العينة، وفريقنا هيتابع معاكِ." : data.error || "تعذر تسجيل طلب العينة");
  };

  const joinWaitlist = async () => {
    setBusyAction("waitlist"); setMessage("");
    const response = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: fabric.id, color }) });
    const data = await response.json().catch(() => ({})); setBusyAction("");
    setMessage(response.ok ? "اتسجلتي في قائمة الانتظار. هنبعتلك إشعار لما اللون يتوفر." : data.error || "تعذر تسجيل التنبيه");
  };

  const addToCart = async () => {
    const input: CartProductInput = { ...fabric, meters, color };
    const response = await fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: fabric.id, meters, color }) });
    if (response.status === 401) { addLocalCartItem(input); setMessage("تمت إضافة القماش إلى السلة على هذا الجهاز."); return; }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || "تعذر حفظ القماش في السلة"); return; }
    setMessage("تمت إضافة القماش إلى سلتك.");
  };

  return <main dir="rtl" className="product-page"><nav className="simple-nav"><Link href="/">صَالِح</Link><Link href="/shop">← العودة للأقمشة</Link></nav><section className="product-detail"><div className="product-detail-image">{fabric.image ? <img src={fabric.image} alt={fabric.name} /> : <div className="product-detail-placeholder"><span>{fabric.type}</span><small>صورة المنتج قيد الرفع من التاجر</small></div>}<div className="product-image-actions"><button type="button" className={saved ? "saved" : ""} onClick={() => void toggleFavorite()} disabled={busyAction === "favorite"} aria-label="إضافة إلى المفضلة"><Heart aria-hidden="true" fill={saved ? "currentColor" : "none"} /></button><button type="button" onClick={() => { if (navigator.share) void navigator.share({ title: fabric.name, url: window.location.href }); }} aria-label="مشاركة المنتج"><Share2 aria-hidden="true" /></button></div></div><div className="product-detail-copy"><p className="eyebrow">{fabric.type} {fabric.verified ? " / موثق" : " / متاح"}</p><h1>{fabric.name}</h1><p className="product-lead">{fabric.note || "تفاصيل القماش يضيفها التاجر عند توثيق المنتج."}{fabric.feel ? ` مناسب للتصميمات اللي محتاجة ${fabric.feel}.` : ""}</p>{fabric.material || fabric.weight || fabric.care || fabric.deliveryNote ? <div className="product-specs"><span><b>الخامة</b>{fabric.material || "غير مذكورة"}</span><span><b>الوزن</b>{fabric.weight ? `${fabric.weight} GSM` : "غير مذكور"}</span><span><b>العناية</b>{fabric.care || "تتحدد مع التاجر"}</span><span><b>التوصيل</b>{fabric.deliveryNote || "يظهر في إتمام الطلب"}</span></div> : null}<div className="product-facts"><span><b>{fabric.width ? `${fabric.width} سم` : "—"}</b> العرض</span><span><b>{outOfStock ? "غير متاح" : `${fabric.stock} متر`}</b> المخزون</span><span><b>{unitPrice.toLocaleString("ar-EG")} ج.م</b> سعر المتر{fabric.salePrice && <del>{fabric.price.toLocaleString("ar-EG")}</del>}</span></div>{fabric.colors.length > 0 && <div className="choice-label"><span>اختاري اللون</span><div className="color-swatches" role="group" aria-label="ألوان القماش">{fabric.colors.map((item) => <button type="button" key={item} className={color === item ? "selected" : ""} onClick={() => setColor(item)}>{item}</button>)}</div></div>}{!fabric.colors.length && <label className="choice-label">اختاري اللون<input value={color} onChange={(e) => setColor(e.target.value)} placeholder="اكتبي اللون المطلوب" /></label>}{!outOfStock && <><label className="choice-label">هتحتاجي كام متر؟<div className="meter-control"><button type="button" aria-label="تقليل الأمتار" onClick={() => setMeters(Math.max(0.5, meters - 0.5))}>−</button><strong>{meters} متر</strong><button type="button" aria-label="زيادة الأمتار" onClick={() => setMeters(Math.min(fabric.stock, meters + 0.5))}>+</button></div></label><div className="product-total"><span>الإجمالي التقديري</span><strong>{total.toLocaleString("ar-EG")} ج.م</strong></div><button className="primary full-button" onClick={() => setNextStep(true)}>اختاري هتعملي إيه بالقماش ←</button></>}{outOfStock && <div className="product-unavailable"><strong>القماش خلص مؤقتاً</strong><p>سجّلي اللون اللي يهمك وهنبلغك أول ما يرجع للمخزون.</p><button className="primary full-button" type="button" onClick={() => void joinWaitlist()} disabled={busyAction === "waitlist"}>{busyAction === "waitlist" ? "جاري التسجيل..." : "بلغيني عند التوفر"}</button></div>}<button className="sample-request-button" type="button" onClick={() => void requestSample()} disabled={busyAction === "sample"}><Star aria-hidden="true" /> {busyAction === "sample" ? "جاري التسجيل..." : "اطلبي عينة من القماش"}</button>{message && <p className="form-success-inline">{message} {message.includes("السلة") && <Link href="/cart">راجعي السلة ←</Link>}</p>}<p className="product-disclaimer">السعر تقديري حسب عدد الأمتار. الكمية النهائية للتصميم تتأكد مع الخيّاطة.</p></div></section><ProductReviews productId={fabric.id} />{nextStep && <div className="overlay" onClick={() => setNextStep(false)}><div className="intent-modal" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setNextStep(false)}>×</button><p className="eyebrow">خطوة واحدة قبل السلة</p><h2>هتعملي إيه بالقماش؟</h2><p>اختاري المسار المناسب عشان نجهزلك الخطوة التالية.</p><Link className="intent-choice" href={`/checkout?fabric=${fabric.slug}&meters=${meters}&color=${encodeURIComponent(color)}&mode=fabric`}><strong>أشتري القماش فقط</strong><span>أكملي للبيانات والدفع عند الاستلام ←</span></Link><button type="button" className="intent-choice" onClick={() => void addToCart()}><strong>أضيفي القماش للسلة</strong><span>احتفظي به مع اختيارات أخرى ←</span></button><Link className="intent-choice highlighted" href={`/tailoring/${fabric.slug}?meters=${meters}&color=${encodeURIComponent(color)}`}><strong>أعمل فستان أو قطعة</strong><span>ابعتي تفاصيل التصميم والصورة للإدارة ←</span></Link></div></div>}</main>;
}
