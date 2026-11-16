"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, SlidersHorizontal } from "lucide-react";

type LiveFabric = { id: string; slug: string; name: string; type: string; price: number; salePrice: number | null; stock: number; width: number | null; image: string | null; colors: string[]; verified: boolean; newArrival: boolean; bestSeller: boolean; createdAt: string };

function FabricImage({ fabric }: { fabric: LiveFabric }) { return fabric.image ? <img src={fabric.image} alt={fabric.name} loading="lazy" /> : <div className="catalog-image-empty"><span>{fabric.type}</span><small>صورة المنتج قيد الرفع</small></div>; }

export default function CatalogPage({ mode = "all" }: { mode?: "all" | "categories" }) {
  const [products, setProducts] = useState<LiveFabric[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("الكل");
  const [color, setColor] = useState("الكل");
  const [availability, setAvailability] = useState("available");
  const [sort, setSort] = useState("recommended");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch("/api/fabrics?available=false").then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog"))).then((payload: { data?: LiveFabric[] }) => { setProducts(payload.data || []); setState("ready"); }).catch(() => setState("error"));
    void fetch("/api/wishlist").then((response) => response.ok ? response.json() : null).then((payload: { data?: { product_id: string }[] } | null) => setSavedIds((payload?.data || []).map((item) => item.product_id)));
  }, []);

  const categories = ["الكل", ...Array.from(new Set(products.map((fabric) => fabric.type)))];
  const colors = ["الكل", ...Array.from(new Set(products.flatMap((fabric) => fabric.colors)))];
  const visible = useMemo(() => {
    const low = Number(minPrice), high = Number(maxPrice);
    const list = products.filter((fabric) => {
      const price = fabric.salePrice ?? fabric.price;
      const matchesType = type === "الكل" || fabric.type === type;
      const matchesQuery = !query || `${fabric.name} ${fabric.type} ${fabric.colors.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
      const matchesColor = color === "الكل" || fabric.colors.includes(color);
      const matchesAvailability = availability === "all" || (availability === "available" ? fabric.stock > 0 : fabric.stock <= 0);
      const matchesPrice = (!minPrice || price >= low) && (!maxPrice || price <= high);
      return matchesType && matchesQuery && matchesColor && matchesAvailability && matchesPrice;
    });
    return [...list].sort((a, b) => sort === "price-low" ? (a.salePrice ?? a.price) - (b.salePrice ?? b.price) : sort === "price-high" ? (b.salePrice ?? b.price) - (a.salePrice ?? a.price) : sort === "best" ? Number(b.bestSeller) - Number(a.bestSeller) : sort === "offers" ? Number(Boolean(b.salePrice)) - Number(Boolean(a.salePrice)) : Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
  }, [availability, color, maxPrice, minPrice, products, query, sort, type]);

  const toggleFavorite = async (productId: string) => {
    const saved = savedIds.includes(productId);
    const response = await fetch("/api/wishlist", { method: saved ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId }) });
    if (response.status === 401) return;
    if (response.ok) setSavedIds((current) => saved ? current.filter((id) => id !== productId) : [...current, productId]);
  };

  return <main dir="rtl" className="catalog-page"><header className="catalog-header"><Link href="/">← العودة إلى صَالِح</Link><p className="eyebrow">{mode === "categories" ? "اكتشفي حسب النوع" : "أقمشة تحكي حكاية"}</p><h1>{mode === "categories" ? "اختاري القسم اللي يشبهك." : "كل الأقمشة، في مكان واحد."}</h1><p>المنتجات الظاهرة هنا تأتي من مخزون صَالِح المتاح، مع السعر والكمية المضافة من التاجر.</p></header><section className="catalog-content"><div className="catalog-toolbar"><div className="catalog-search large"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="دوري باسم القماش أو النوع أو اللون" /></div><button className="catalog-filter-toggle" type="button" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal aria-hidden="true" /> الفلاتر</button><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recommended">الأحدث</option><option value="best">الأكثر مبيعاً</option><option value="offers">العروض</option><option value="price-low">الأقل سعراً</option><option value="price-high">الأعلى سعراً</option></select></div><div className={`catalog-filters ${showFilters ? "open" : ""}`}><label>التوفر<select value={availability} onChange={(e) => setAvailability(e.target.value)}><option value="available">متاح الآن</option><option value="all">كل المنتجات</option><option value="out">غير متاح حالياً</option></select></label><label>اللون<select value={color} onChange={(e) => setColor(e.target.value)}>{colors.map((item) => <option key={item}>{item}</option>)}</select></label><label>أقل سعر<input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="ج.م" /></label><label>أعلى سعر<input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="ج.م" /></label></div>{state === "loading" && <div className="account-empty"><span className="home-v2-spinner" /><p>بنحمّل المنتجات المتاحة...</p></div>}{state === "error" && <div className="account-empty"><h2>تعذر تحميل الكتالوج</h2><p>حاولي مرة أخرى بعد قليل.</p></div>}{state === "ready" && <div className="catalog-layout"><aside className="catalog-categories"><p className="eyebrow">الأقسام المتاحة</p>{categories.map((category) => <button className={type === category ? "active" : ""} key={category} onClick={() => setType(category)}>{category}<span>←</span></button>)}</aside><div className="catalog-results"><div className="catalog-result-head"><span>{visible.length} منتجات</span><span>السعر بالجنيه المصري / متر</span></div>{visible.length ? <div className="catalog-grid">{visible.map((fabric) => <article className="catalog-product" key={fabric.id}><Link href={`/fabrics/${fabric.slug}`} className="catalog-product-image"><FabricImage fabric={fabric} /><span>{fabric.stock > 0 ? (fabric.newArrival ? "جديد" : fabric.bestSeller ? "الأكثر مبيعاً" : "متاح") : "بلغيني عند التوفر"}</span></Link><button className={`catalog-favorite ${savedIds.includes(fabric.id) ? "saved" : ""}`} type="button" onClick={() => void toggleFavorite(fabric.id)} aria-label={`حفظ ${fabric.name}`}><Heart aria-hidden="true" fill={savedIds.includes(fabric.id) ? "currentColor" : "none"} /></button><div className="catalog-product-info"><div><h2>{fabric.name}</h2><p>{fabric.type} · {fabric.width ? `${fabric.width} سم` : "العرض يحدده التاجر"}{fabric.colors.length ? ` · ${fabric.colors.slice(0, 2).join("، ")}` : ""}</p></div><strong>{(fabric.salePrice ?? fabric.price).toLocaleString("ar-EG")} <small>ج.م</small>{fabric.salePrice && <del>{fabric.price.toLocaleString("ar-EG")}</del>}</strong></div><div className="catalog-actions"><Link href={`/fabrics/${fabric.slug}`}>عرض التفاصيل</Link><Link className="buy-link" href={`/fabrics/${fabric.slug}`}>{fabric.stock > 0 ? "اشتري الآن ←" : "اعرفي المزيد ←"}</Link></div></article>)}</div> : <div className="account-empty"><span>◌</span><h2>مفيش منتجات مطابقة</h2><p>جربي تغيري الفلاتر أو ارجعي للكتالوج الكامل.</p><button className="text-button" onClick={() => { setType("الكل"); setColor("الكل"); setAvailability("available"); setMinPrice(""); setMaxPrice(""); setQuery(""); }}>مسح الفلاتر</button></div>}</div></div>}</section></main>;
}
