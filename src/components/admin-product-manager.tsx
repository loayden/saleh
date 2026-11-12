"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Package, Pencil, Search, ShieldCheck, Trash2, X } from "lucide-react";

type Product = {
  id: string;
  name_ar: string;
  slug: string;
  fabric_type: string;
  price_egp: number | string;
  width_cm: number | null;
  colors: string[] | null;
  note: string | null;
  feel: string | null;
  image_url: string | null;
  active: boolean;
  verified: boolean;
  inventory: { meters: number | string }[] | { meters: number | string } | null;
};

function stock(product: Product) {
  const value = Array.isArray(product.inventory) ? product.inventory[0]?.meters : product.inventory?.meters;
  return Number(value || 0);
}

export default function AdminProductManager({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const visible = useMemo(() => products.filter((product) => `${product.name_ar} ${product.slug} ${product.fabric_type}`.toLowerCase().includes(query.trim().toLowerCase())), [products, query]);

  const update = async (product: Product, action: string, meters?: number) => {
    setBusy(`${product.id}:${action}`); setMessage("");
    const response = await fetch("/api/merchant/products", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: product.id, action, meters }) });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) return setMessage(payload.error || "تعذر تحديث المنتج");
    setProducts((items) => items.map((item) => item.id === product.id ? { ...item, ...(action === "publish" || action === "unpublish" ? { active: action === "publish" } : {}), ...(action === "verify" || action === "unverify" ? { verified: action === "verify" } : {}), ...(action === "stock" ? { inventory: [{ meters: meters ?? 0 }] } : {}) } : item));
    setMessage("تم تحديث المنتج من قاعدة البيانات");
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(`${editing.id}:edit`); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/merchant/products", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: editing.id, nameAr: form.get("nameAr"), slug: form.get("slug"), fabricType: form.get("fabricType"), priceEgp: form.get("priceEgp"), meters: form.get("meters"), widthCm: form.get("widthCm"), colors: String(form.get("colors") || "").split(","), note: form.get("note"), feel: form.get("feel"), imageUrl: form.get("imageUrl") }) });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) return setMessage(payload.error || "تعذر حفظ تعديل المنتج");
    const updated: Product = { ...editing, name_ar: String(form.get("nameAr") || ""), slug: String(form.get("slug") || ""), fabric_type: String(form.get("fabricType") || ""), price_egp: Number(form.get("priceEgp")), width_cm: form.get("widthCm") ? Number(form.get("widthCm")) : null, colors: String(form.get("colors") || "").split(",").map((value) => value.trim()).filter(Boolean), note: String(form.get("note") || "") || null, feel: String(form.get("feel") || "") || null, image_url: String(form.get("imageUrl") || "") || null, inventory: [{ meters: Number(form.get("meters")) }] };
    setProducts((items) => items.map((item) => item.id === editing.id ? updated : item));
    setEditing(null); setMessage("تم تعديل المنتج وحفظه في قاعدة البيانات");
  };

  const archive = async (product: Product) => {
    if (!window.confirm(`إيقاف نشر ${product.name_ar}؟`)) return;
    setBusy(`${product.id}:archive`); setMessage("");
    const response = await fetch("/api/merchant/products", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
    const payload = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) return setMessage(payload.error || "تعذر إيقاف المنتج");
    setProducts((items) => items.map((item) => item.id === product.id ? { ...item, active: false } : item));
    setMessage("تم إيقاف نشر المنتج بأمان");
  };

  return <section className="dashboard-panel admin-product-manager">
    <div className="panel-head"><div><p className="eyebrow">كتالوج حقيقي</p><h2>إدارة المنتجات والنشر</h2></div><span className="live-badge"><ShieldCheck aria-hidden="true" /> إدارة محمية</span></div>
    <div className="admin-product-search"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحثي بالاسم أو النوع أو الرابط" /></div>
    {message && <p className="form-success-inline" role="status">{message}</p>}
    {editing && <form className="admin-product-edit" onSubmit={saveEdit}>
      <div className="panel-head"><div><p className="eyebrow">تعديل مباشر</p><h3>{editing.name_ar}</h3></div><button type="button" className="admin-edit-close" onClick={() => setEditing(null)} aria-label="إغلاق التعديل"><X aria-hidden="true" /></button></div>
      <div className="admin-edit-grid">
        <label>اسم القماش<input name="nameAr" defaultValue={editing.name_ar} required /></label>
        <label>الرابط المختصر<input name="slug" defaultValue={editing.slug} required pattern="[a-z0-9-]{2,100}" dir="ltr" /></label>
        <label>النوع<input name="fabricType" defaultValue={editing.fabric_type} required /></label>
        <label>السعر / متر<input name="priceEgp" type="number" min="0" step="0.01" defaultValue={editing.price_egp} required /></label>
        <label>المخزون بالمتر<input name="meters" type="number" min="0" step="0.5" defaultValue={stock(editing)} required /></label>
        <label>العرض بالسنتيمتر<input name="widthCm" type="number" min="1" step="1" defaultValue={editing.width_cm || ""} /></label>
        <label>الألوان مفصولة بفاصلة<input name="colors" defaultValue={editing.colors?.join(", ")} /></label>
        <label>رابط الصورة<input name="imageUrl" type="url" defaultValue={editing.image_url || ""} dir="ltr" /></label>
      </div>
      <label>الإحساس/الملمس<input name="feel" defaultValue={editing.feel || ""} /></label>
      <label>ملاحظات<input name="note" defaultValue={editing.note || ""} /></label>
      <button className="primary" disabled={busy !== ""} type="submit">{busy === `${editing.id}:edit` ? "جاري الحفظ..." : "حفظ التعديلات"}</button>
    </form>}
    {visible.length === 0 ? <div className="dashboard-empty"><Package aria-hidden="true" /><h3>لا توجد منتجات مطابقة</h3><p>أضيفي منتجاً من نموذج المنتجات، أو عدّلي كلمة البحث.</p></div> : <div className="admin-product-list">{visible.map((product) => {
      const meters = stock(product);
      return <article className="admin-product-row" key={product.id}>
        <div className="admin-product-thumb">{product.image_url ? <img src={product.image_url} alt={product.name_ar} /> : <Package aria-hidden="true" />}</div>
        <div className="admin-product-info"><strong>{product.name_ar}</strong><small>{product.fabric_type} · {product.slug}</small><span>{Number(product.price_egp).toLocaleString("ar-EG")} ج.م / متر · {meters.toLocaleString("ar-EG")} متر</span><div className="admin-product-badges"><small className={product.active ? "status-good" : "status-muted"}>{product.active ? "منشور" : "موقوف"}</small><small className={product.verified ? "status-good" : "status-muted"}>{product.verified ? "موثق" : "بانتظار التحقق"}</small></div></div>
        <div className="admin-product-actions"><label>المخزون<input type="number" min="0" step="0.5" defaultValue={meters} onBlur={(event) => { const next = Number(event.currentTarget.value); if (Number.isFinite(next) && next !== meters) void update(product, "stock", next); }} /></label><button type="button" title="تعديل المنتج" aria-label={`تعديل ${product.name_ar}`} disabled={busy !== ""} onClick={() => setEditing(product)}><Pencil aria-hidden="true" /></button><button type="button" title={product.active ? "إيقاف النشر" : "نشر المنتج"} disabled={busy !== ""} onClick={() => void update(product, product.active ? "unpublish" : "publish")}>{product.active ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>{product.verified ? <button type="button" title="إلغاء التوثيق" disabled={busy !== ""} onClick={() => void update(product, "unverify")}><X aria-hidden="true" /></button> : <button type="button" title="توثيق المنتج" disabled={busy !== ""} onClick={() => void update(product, "verify")}><Check aria-hidden="true" /></button>}<button type="button" title="إيقاف المنتج" aria-label={`إيقاف ${product.name_ar}`} disabled={busy !== "" || !product.active} onClick={() => void archive(product)}><Trash2 aria-hidden="true" /></button></div>
      </article>;
    })}</div>}
  </section>;
}
