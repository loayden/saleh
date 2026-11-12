"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/analytics";
import { CART_STORAGE_KEY, type CartItem } from "@/lib/cart";
import AuthAccountLink from "@/components/auth-account-link";
import { Compass, Heart, Home as HomeIcon, Menu, ShoppingBag, UserRound, X } from "lucide-react";

type LiveFabric = {
  id: string;
  slug: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  width: number | null;
  image: string | null;
  verified: boolean;
  colors?: string[];
};

const categories = [
  { slug: "evening", title: "للسهرة", text: "اختيارات لقطعة لها حضور.", image: "/images/editorial-evening.jpg" },
  { slug: "everyday", title: "لليوم العادي", text: "راحة وملمس يعيش معاكي.", image: "/images/editorial-everyday.jpg" },
  { slug: "wardrobe", title: "خزانة هادئة", text: "ألوان وخامات سهلة التنسيق.", image: "/images/editorial-wardrobe.jpg" },
];

const steps = [
  ["01", "اكتشفي", "ابدئي من نوع القماش أو الإحساس اللي عايزاه."],
  ["02", "اختاري", "راجعي السعر، العرض، والكمية المتاحة قبل الشراء."],
  ["03", "صمّمي", "اختاري قطعة، اكتبي تفاصيلها، وارفعي صورة إلهام."],
  ["04", "أكّدي", "أرسلي بياناتك ليبدأ الفريق مراجعة الطلب."],
];

function usePersistentState<T>(key: string, initialValue: T) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const eventName = `saleh:${key}`;
    window.addEventListener(eventName, onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
      window.removeEventListener(eventName, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  }, [key]);
  const getSnapshot = useCallback(() => window.localStorage.getItem(key) || JSON.stringify(initialValue), [initialValue, key]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => JSON.stringify(initialValue));
  const parsed = useMemo(() => {
    try { return JSON.parse(value) as T; } catch { return initialValue; }
  }, [initialValue, value]);
  const setValue = useCallback((next: T | ((current: T) => T)) => {
    const updated = typeof next === "function" ? (next as (current: T) => T)(parsed) : next;
    window.localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event(`saleh:${key}`));
  }, [key, parsed]);
  return [parsed, setValue] as const;
}

function FabricVisual({ fabric }: { fabric: LiveFabric }) {
  return fabric.image ? <img src={fabric.image} alt={fabric.name} loading="lazy" /> : <div className="home-fabric-empty" aria-label="صورة المنتج غير مضافة بعد"><span>{fabric.type}</span><small>صورة المنتج قيد الرفع</small></div>;
}

export default function Home() {
  const [products, setProducts] = useState<LiveFabric[]>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [cart, setCart] = usePersistentState<CartItem[]>(CART_STORAGE_KEY, []);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fabrics?available=true")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog")))
      .then((payload: { data?: LiveFabric[] }) => {
        if (!cancelled) { setProducts(payload.data || []); setCatalogState("ready"); }
      })
      .catch(() => { if (!cancelled) setCatalogState("error"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("auth")))
      .then((payload: { data?: { product_id: string }[]; authenticated?: boolean }) => setWishlist(payload.authenticated === false ? [] : (payload.data || []).map((item) => item.product_id)))
      .catch(() => setWishlist([]));
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const toggleWishlist = async (fabric: LiveFabric) => {
    const saved = wishlist.includes(fabric.id);
    const response = await fetch("/api/wishlist", { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: fabric.id }) });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) { notify("سجلي الدخول عشان تحفظي القماش"); return; }
    if (!response.ok) { notify(payload.error || "تعذر تحديث المفضلة"); return; }
    setWishlist((items) => saved ? items.filter((item) => item !== fabric.id) : [...items, fabric.id]);
    trackEvent("product_view", { product_id: fabric.id, saved: !saved });
  };
  const closeMenu = () => setMobileMenu(false);

  return <main dir="rtl" className="home-v2">
    <div className="home-v2-topline">مساحة هادئة لاكتشاف القماش وتصميم القطعة اللي تشبهك</div>
    <nav className="home-v2-nav">
      <Link className="home-v2-brand" href="/">صَالِح<small>FABRIC / DESIGN / YOU</small></Link>
      <div className="home-v2-links"><Link href="/categories">اكتشفي الأقمشة</Link><Link href="/shop">تسوّقي</Link><Link href="/tailors">صمّمي قطعتك</Link><Link href="/guide">دليل الأقمشة</Link></div>
      <div className="home-v2-tools"><Link href="/favorites" aria-label="المفضلة"><Heart aria-hidden="true" /></Link><AuthAccountLink showLabel={false} /><button className="home-v2-bag" aria-label="السلة" onClick={() => setCartOpen(true)}><ShoppingBag aria-hidden="true" /><b>{cart.length}</b></button><button className="home-v2-menu-button" aria-label={mobileMenu ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></div>
    </nav>

    {mobileMenu && <div className="home-v2-mobile-menu" role="dialog" aria-label="القائمة الرئيسية"><div><strong>صَالِح</strong><button onClick={closeMenu} aria-label="إغلاق القائمة"><X aria-hidden="true" /></button></div><Link href="/categories" onClick={closeMenu}><Compass aria-hidden="true" />اكتشفي الأقمشة <span>←</span></Link><Link href="/shop" onClick={closeMenu}><ShoppingBag aria-hidden="true" />تسوّقي كل الأقمشة <span>←</span></Link><Link href="/tailors" onClick={closeMenu}>صمّمي قطعتك <span>←</span></Link><Link href="/visualizer" onClick={closeMenu}>استوديو التصور <span>←</span></Link><Link href="/assistant" onClick={closeMenu}>اسألي مساعد صَالِح <span>←</span></Link><Link href="/account" onClick={closeMenu}><UserRound aria-hidden="true" />حسابي <span>←</span></Link></div>}

    <section className="home-v2-hero"><div className="home-v2-hero-copy"><p className="home-v2-kicker">أقمشة تحكي حكاية</p><h1>ابدئي من الملمس.<br /><em>وانتهي بحاجة تشبهك.</em></h1><p>اكتشفي الأقمشة المتاحة فعلياً، قارني تفاصيلها، ثم ابدئي تصميم قطعتك بخطوات واضحة.</p><div className="home-v2-actions"><Link className="home-v2-primary" href="/categories">اكتشفي الأقمشة <span>←</span></Link><Link className="home-v2-secondary" href="/shop">تسوّقي الآن</Link></div><div className="home-v2-trust"><span>01</span><span>منتجات موثقة من المخزون المتاح</span></div></div><div className="home-v2-hero-image"><img src="/images/hero-fashion.jpg" alt="أزياء وقطع مختارة من عالم صَالِح" /></div></section>

    <section className="home-v2-section home-v2-fabrics" id="fabrics"><div className="home-v2-section-head"><div><p className="home-v2-kicker">من المخزون المتاح</p><h2>أقمشة تحكي حكاية</h2></div><Link href="/shop">اكتشفي كل الأقمشة <span>←</span></Link></div>{catalogState === "loading" && <div className="home-v2-state"><span className="home-v2-spinner" />بنحمّل المنتجات المتاحة...</div>}{catalogState === "error" && <div className="home-v2-state"><h3>تعذر تحميل المنتجات حالياً</h3><p>حاولي مرة أخرى بعد قليل أو ابدئي من صفحة المتجر.</p><Link className="home-v2-secondary" href="/shop">فتح المتجر</Link></div>}{catalogState === "ready" && products.length === 0 && <div className="home-v2-state home-v2-empty"><span>◌</span><h3>المنتجات الموثقة قيد الإضافة</h3><p>سنظهر هنا فقط الأقمشة التي أضافها التاجر وراجعها الفريق. لا نعرض منتجات أو أسعاراً غير مؤكدة.</p><Link className="home-v2-secondary" href="/shop">اذهبي إلى المتجر</Link></div>}{products.length > 0 && <div className="home-v2-product-grid">{products.slice(0, 4).map((fabric) => { const saved = wishlist.includes(fabric.id); return <article className="home-v2-product" key={fabric.id}><Link href={`/fabrics/${fabric.slug}`} className="home-v2-product-image"><FabricVisual fabric={fabric} /><span>{fabric.verified ? "موثق" : "متاح"}</span></Link><div className="home-v2-product-meta"><div><h3>{fabric.name}</h3><p>{fabric.type}</p></div><strong>{fabric.price.toLocaleString("ar-EG")} <small>ج.م / متر</small></strong></div><div className="home-v2-product-actions"><button onClick={() => toggleWishlist(fabric)} aria-label={saved ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}>{saved ? "♥" : "♡"}</button><Link href={`/fabrics/${fabric.slug}`}>اختاري الكمية</Link><Link className="home-v2-add" href={`/fabrics/${fabric.slug}`}>عرض التفاصيل</Link></div></article>; })}</div>}</section>

    <section className="home-v2-section home-v2-categories"><div className="home-v2-section-head"><div><p className="home-v2-kicker">اختاري المناسبة</p><h2>اكتشفي حسب النوع</h2></div><Link href="/categories">اكتشفي المزيد <span>←</span></Link></div><div className="home-v2-category-grid">{categories.map((category) => <Link className="home-v2-category" href={`/categories/${category.slug}`} key={category.slug}><img src={category.image} alt="" loading="lazy" /><div><span>{category.title}</span><strong>{category.text}</strong><small>اكتشفي المجموعة ←</small></div></Link>)}</div></section>

    <section className="home-v2-design"><div className="home-v2-design-copy"><p className="home-v2-kicker">صمّمي قطعتك</p><h2>من القماش<br /><em>للفكرة الكاملة.</em></h2><p>اختاري قماشاً متاحاً، حددي القطعة اللي عايزاها، اكتبي تفاصيلها، وارفعي صورة إلهام. فريق صَالِح يراجع الطلب قبل تأكيد الخطوة التالية.</p><Link className="home-v2-primary" href={products[0] ? `/tailoring/${products[0].slug}?meters=3` : "/tailors"}>ابدئي تصميم قطعتك <span>←</span></Link></div><div className="home-v2-design-image"><img src="/images/editorial-evening.jpg" alt="إلهام لتصميم قطعة أزياء" loading="lazy" /></div></section>

    <section className="home-v2-section home-v2-how"><div className="home-v2-section-head"><div><p className="home-v2-kicker">طريقة واضحة</p><h2>إزاي صَالِح بتشتغل؟</h2></div><Link href="/guide">اعرفي التفاصيل <span>←</span></Link></div><div className="home-v2-steps">{steps.map(([number, title, text]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>

    <section className="home-v2-story"><div><p className="home-v2-kicker">حكاية صَالِح</p><h2>اختيار أبسط.<br /><em>وثقة أكتر.</em></h2><p>صَالِح مساحة تجمع اكتشاف القماش مع بداية التصميم. نوضح المتاح، نفصل بين الإلهام والمنتج، ونترك القرار النهائي ليكي.</p><Link className="home-v2-secondary" href="/guide">اعرفي حكايتنا <span>←</span></Link></div><div className="home-v2-story-image"><img src="/images/editorial-wardrobe.jpg" alt="خامات وقطع أزياء في مساحة هادئة" loading="lazy" /></div></section>

    <section className="home-v2-final"><p className="home-v2-kicker">جاهزة تبدأي؟</p><h2>القماش الأول<br /><em>هو بداية الحكاية.</em></h2><div><Link className="home-v2-primary" href="/categories">اكتشفي الأقمشة <span>←</span></Link><Link className="home-v2-light-link" href="/tailors">ابدئي تصميم قطعتك</Link></div></section>

    <footer className="home-v2-footer"><div><div className="home-v2-brand">صَالِح<small>FABRIC / DESIGN / YOU</small></div><p>اكتشاف القماش، وبداية قطعة تشبهك.</p></div><div><h3>اكتشفي</h3><Link href="/shop">كل الأقمشة</Link><Link href="/categories">الأقسام</Link><Link href="/guide">دليل الأقمشة</Link></div><div><h3>ابدئي</h3><Link href="/tailors">تصميم قطعتك</Link><Link href="/visualizer">استوديو التصور</Link><Link href="/account">حسابك</Link></div></footer>

    <nav className="mobile-bottom-nav" aria-label="تنقل سريع"><Link href="/" className="active"><HomeIcon aria-hidden="true" /><small>الرئيسية</small></Link><Link href="/categories"><Compass aria-hidden="true" /><small>اكتشفي</small></Link><Link href="/cart"><ShoppingBag aria-hidden="true" /><small>السلة {cart.length ? `(${cart.length})` : ""}</small></Link><Link href="/favorites"><Heart aria-hidden="true" /><small>المفضلة</small></Link><AuthAccountLink /></nav>
    {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="home-v2-cart" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة"><X aria-hidden="true" /></button><p className="home-v2-kicker">سلتك</p><h2>اختياراتك</h2>{cart.length === 0 ? <div className="home-v2-cart-empty">لم تضيفي أي قماش بعد.<br /><Link href="/shop" onClick={() => setCartOpen(false)}>ابدئي من المتجر ←</Link></div> : <><div>{cart.map((fabric, index) => <div className="home-v2-cart-item" key={`${fabric.id}-${fabric.color}-${index}`}><div><strong>{fabric.name}</strong><small>{fabric.meters} متر · {fabric.price.toLocaleString("ar-EG")} ج.م / متر</small></div><button onClick={() => setCart((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`إزالة ${fabric.name}`}><X aria-hidden="true" /></button></div>)}</div><Link className="home-v2-primary home-v2-cart-checkout" href="/cart" onClick={() => setCartOpen(false)}>مراجعة السلة ←</Link></>}</aside></div>}
    {toast && <div className="toast">{toast}</div>}
  </main>;
}
