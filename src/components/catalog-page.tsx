"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LiveFabric = { id: string; slug: string; name: string; type: string; price: number; stock: number; width: number | null; image: string | null; verified: boolean };

function FabricImage({ fabric }: { fabric: LiveFabric }) {
  return fabric.image ? <img src={fabric.image} alt={fabric.name} loading="lazy" /> : <div className="catalog-image-empty"><span>{fabric.type}</span><small>صورة المنتج قيد الرفع</small></div>;
}

export default function CatalogPage({ mode = "all" }: { mode?: "all" | "categories" }) {
  const [products, setProducts] = useState<LiveFabric[]>([]), [query, setQuery] = useState(""), [type, setType] = useState("الكل"), [sort, setSort] = useState("recommended"), [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    fetch("/api/fabrics?available=true").then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog"))).then((payload: { data?: LiveFabric[] }) => { setProducts(payload.data || []); setState("ready"); }).catch(() => setState("error"));
  }, []);
  const categories = ["الكل", ...Array.from(new Set(products.map((fabric) => fabric.type)))];
  const visible = useMemo(() => {
    const list = products.filter((fabric) => (type === "الكل" || fabric.type === type) && (!query || `${fabric.name} ${fabric.type}`.toLowerCase().includes(query.trim().toLowerCase())));
    return [...list].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : a.name.localeCompare(b.name));
  }, [products, query, sort, type]);
  return <main dir="rtl" className="catalog-page"><header className="catalog-header"><Link href="/">← العودة إلى صَالِح</Link><p className="eyebrow">{mode === "categories" ? "اكتشفي حسب النوع" : "أقمشة تحكي حكاية"}</p><h1>{mode === "categories" ? "اختاري القسم اللي يشبهك." : "كل الأقمشة، في مكان واحد."}</h1><p>المنتجات الظاهرة هنا تأتي من مخزون صَالِح المتاح، مع السعر والكمية المضافة من التاجر.</p></header><section className="catalog-content"><div className="catalog-toolbar"><div className="catalog-search large"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="دوري باسم القماش أو النوع" /></div><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recommended">الأحدث</option><option value="price-low">الأقل سعراً</option><option value="price-high">الأعلى سعراً</option></select></div>{state === "loading" && <div className="account-empty"><span className="home-v2-spinner" /><p>بنحمّل المنتجات المتاحة...</p></div>}{state === "error" && <div className="account-empty"><h2>تعذر تحميل الكتالوج</h2><p>حاولي مرة أخرى بعد قليل.</p></div>}{state === "ready" && <div className="catalog-layout"><aside className="catalog-categories"><p className="eyebrow">الأقسام المتاحة</p>{categories.map((category) => <button className={type === category ? "active" : ""} key={category} onClick={() => setType(category)}>{category}<span>←</span></button>)}</aside><div className="catalog-results"><div className="catalog-result-head"><span>{visible.length} أقمشة متاحة</span><span>السعر بالجنيه المصري / متر</span></div>{visible.length ? <div className="catalog-grid">{visible.map((fabric) => <article className="catalog-product" key={fabric.id}><Link href={`/fabrics/${fabric.slug}`} className="catalog-product-image"><FabricImage fabric={fabric} /><span>{fabric.verified ? "موثق" : "متاح"}</span></Link><div className="catalog-product-info"><div><h2>{fabric.name}</h2><p>{fabric.type} · {fabric.width ? `${fabric.width} سم` : "العرض يحدده التاجر"}</p></div><strong>{fabric.price.toLocaleString("ar-EG")} <small>ج.م</small></strong></div><div className="catalog-actions"><Link href={`/fabrics/${fabric.slug}`}>عرض التفاصيل</Link><Link className="buy-link" href={`/fabrics/${fabric.slug}`}>اشتري الآن ←</Link></div></article>)}</div> : <div className="account-empty"><span>◌</span><h2>المنتجات الموثقة قيد الإضافة</h2><p>سنظهر هنا فقط المنتجات التي أضافها التاجر وراجعها الفريق.</p></div>}</div></div>}</section></main>;
}
