"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, LogIn, Trash2 } from "lucide-react";

type SavedFabric = { product_id: string; fabric_products: { id: string; slug: string; name_ar: string; price_egp: number | string; image_url: string | null } | null };

export default function FavoritesPage() {
  const [items, setItems] = useState<SavedFabric[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "auth" | "error">("loading");

  const load = () => {
    setState("loading");
    fetch("/api/wishlist")
      .then((response) => { if (response.status === 401) { setState("auth"); return null; } if (!response.ok) throw new Error("wishlist"); return response.json(); })
      .then((payload: { data?: SavedFabric[] } | null) => { if (payload) { setItems(payload.data || []); setState("ready"); } })
      .catch(() => setState("error"));
  };
  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishlist")
      .then((response) => { if (!response.ok) throw new Error("wishlist"); return response.json(); })
      .then((payload: { authenticated?: boolean; data?: SavedFabric[] }) => { if (cancelled) return; if (payload.authenticated === false) { setState("auth"); return; } setItems(payload.data || []); setState("ready"); })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, []);

  const remove = async (productId: string) => {
    const response = await fetch("/api/wishlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
    if (response.ok) setItems((current) => current.filter((item) => item.product_id !== productId));
  };

  return <main dir="rtl" className="account-page"><Link href="/">← العودة للمتجر</Link><p className="eyebrow">مساحتي / المفضلة</p><h1>الحاجات اللي عجبتك</h1>{state === "loading" && <div className="account-empty"><Heart aria-hidden="true" /><p>بنحمّل المفضلة المحفوظة...</p></div>}{state === "error" && <div className="account-empty"><Heart aria-hidden="true" /><h2>تعذر تحميل المفضلة</h2><button className="primary" onClick={load}>حاولي مرة أخرى</button></div>}{state === "auth" && <div className="account-empty"><LogIn aria-hidden="true" /><h2>سجلي الدخول لحفظ اختياراتك</h2><p>المفضلة الآن مرتبطة بحسابك الحقيقي وتظهر على أي جهاز.</p><Link className="primary" href="/auth?next=/favorites">تسجيل الدخول</Link></div>}{state === "ready" && (items.length ? <div className="saved-grid">{items.map((item) => { const fabric = item.fabric_products; if (!fabric) return null; return <article className="saved-card" key={item.product_id}>{fabric.image_url ? <img src={fabric.image_url} alt={fabric.name_ar} /> : <div className="catalog-image-empty"><span>صورة المنتج لم يضفها التاجر</span></div>}<Link href={`/fabrics/${fabric.slug}`}><strong>{fabric.name_ar}</strong><small>{Number(fabric.price_egp).toLocaleString("ar-EG")} ج.م / متر</small></Link><button onClick={() => remove(item.product_id)} aria-label={`حذف ${fabric.name_ar} من المفضلة`}><Trash2 aria-hidden="true" /> حذف</button></article>; })}</div> : <div className="account-empty"><Heart aria-hidden="true" /><h2>لسه مفيش حاجات محفوظة</h2><p>احفظي منتجاً من الكتالوج ليظهر هنا.</p><Link className="primary" href="/shop">اكتشفي الأقمشة ←</Link></div>)}</main>;
}
