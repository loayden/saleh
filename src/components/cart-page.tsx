"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { clearLocalCart, readLocalCart, type CartItem, writeLocalCart } from "@/lib/cart";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/cart");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 401) throw new Error("cart");
      if (payload.authenticated) {
        const local = readLocalCart();
        if (local.length) {
          await Promise.all(local.map((item) => fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: item.id, meters: item.meters, color: item.color }) })));
          clearLocalCart();
          const refreshed = await fetch("/api/cart");
          const refreshedPayload = await refreshed.json();
          setItems((refreshedPayload.data || []) as CartItem[]);
          setState("ready");
          return;
        }
        setItems((payload.data || []) as CartItem[]);
      } else {
        setItems(readLocalCart());
      }
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    // The cart is external client/server state; defer the first sync until after mount.
    const initialLoad = window.setTimeout(() => { void load(); }, 0);
    const onChange = () => setItems(readLocalCart());
    window.addEventListener("saleh-cart", onChange);
    window.addEventListener("storage", onChange);
    return () => { window.clearTimeout(initialLoad); window.removeEventListener("saleh-cart", onChange); window.removeEventListener("storage", onChange); };
  }, [load]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.meters, 0), [items]);

  const update = async (item: CartItem, meters: number) => {
    if (meters <= 0) return remove(item);
    if (item.cartItemId) {
      const response = await fetch("/api/cart", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId: item.cartItemId, meters }) });
      if (!response.ok) { const payload = await response.json().catch(() => ({})); setMessage(payload.error || "تعذر تحديث الكمية"); return; }
    } else {
      writeLocalCart(items.map((entry) => entry === item ? { ...entry, meters } : entry));
    }
    setItems((current) => current.map((entry) => entry === item ? { ...entry, meters } : entry));
  };

  const remove = async (item: CartItem) => {
    if (item.cartItemId) await fetch("/api/cart", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId: item.cartItemId }) });
    else writeLocalCart(items.filter((entry) => entry !== item));
    setItems((current) => current.filter((entry) => entry !== item));
  };

  const clear = async () => {
    if (items.some((item) => item.cartItemId)) await fetch("/api/cart", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ clear: true }) });
    clearLocalCart();
    setItems([]);
  };

  return <main dir="rtl" className="cart-page"><header className="cart-page-header"><Link href="/">← العودة إلى صَالِح</Link><p className="eyebrow">مساحتي / السلة</p><h1>اختياراتك، جاهزة.</h1><p>راجعي اللون والكمية قبل الانتقال لبيانات التوصيل.</p></header><section className="cart-page-content">{state === "loading" && <div className="account-empty"><span className="home-v2-spinner" /><p>بنحمّل السلة...</p></div>}{state === "error" && <div className="account-empty"><ShoppingBag aria-hidden="true" /><h2>تعذر تحميل السلة</h2><button className="primary" onClick={() => void load()}>حاولي مرة أخرى</button></div>}{state === "ready" && items.length === 0 && <div className="account-empty"><ShoppingBag aria-hidden="true" /><h2>السلة فاضية</h2><p>اختاري القماش من الكتالوج، ثم حددي اللون وعدد الأمتار.</p><Link className="primary" href="/shop">اكتشفي الأقمشة ←</Link></div>}{state === "ready" && items.length > 0 && <><div className="cart-items-list">{items.map((item) => <article className="cart-page-item" key={item.cartItemId || `${item.id}-${item.color}`}><div className="cart-page-image">{item.image ? <img src={item.image} alt={item.name} /> : <span>{item.type}</span>}</div><div className="cart-page-item-copy"><Link href={`/fabrics/${item.slug}`}><h2>{item.name}</h2></Link><p>{item.type}{item.color ? ` · ${item.color}` : " · اللون يحدد مع التاجر"}</p><strong>{item.price.toLocaleString("ar-EG")} ج.م / متر</strong><div className="cart-page-controls"><button aria-label={`تقليل كمية ${item.name}`} onClick={() => void update(item, Math.max(0.5, item.meters - 0.5))}><Minus aria-hidden="true" /></button><b>{item.meters} متر</b><button aria-label={`زيادة كمية ${item.name}`} onClick={() => void update(item, Math.min(item.stock, item.meters + 0.5))}><Plus aria-hidden="true" /></button></div></div><button className="cart-page-remove" aria-label={`حذف ${item.name}`} onClick={() => void remove(item)}><Trash2 aria-hidden="true" /></button></article>)}</div><aside className="cart-page-summary"><div><span>عدد الاختيارات</span><strong>{items.length}</strong></div><div><span>الإجمالي قبل التوصيل</span><strong>{subtotal.toLocaleString("ar-EG")} ج.م</strong></div><p>التوصيل يُحسب حسب المحافظة في صفحة checkout. الحجز الفعلي للمخزون يتم عند تأكيد الطلب.</p>{message && <p className="form-error">{message}</p>}<Link className="primary full-button" href="/checkout?cart=1">إتمام الطلب ←</Link><button className="text-button cart-clear" onClick={() => void clear()}>تفريغ السلة</button></aside></>}</section></main>;
}
