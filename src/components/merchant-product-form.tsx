"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MerchantProductForm() {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const uploadImage = async (file: File | undefined) => {
    if (!file || !supabase) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return setMessage("اختاري صورة أقل من 8MB");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("سجّلي الدخول مرة أخرى");
    setUploading(true); setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9.-]/gi, "-").slice(0, 80) || "product";
    const path = `${user.id}/${Date.now()}-${baseName}.${extension}`;
    const result = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) { setUploading(false); return setMessage("تعذر رفع الصورة"); }
    setImageUrl(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    setUploading(false); setMessage("تم رفع الصورة، احفظي المنتج لإكماله");
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/merchant/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nameAr: form.get("nameAr"), slug: form.get("slug"), fabricType: form.get("fabricType"), priceEgp: form.get("priceEgp"), meters: form.get("meters"), widthCm: form.get("widthCm"), colors: String(form.get("colors") || "").split(","), note: form.get("note"), feel: form.get("feel"), imageUrl: imageUrl || form.get("imageUrl") }) });
    const payload = await response.json().catch(() => ({}));
    setSaving(false); setMessage(response.ok ? "تم حفظ المنتج كمسودة بانتظار التحقق." : payload.error || "تعذر حفظ المنتج.");
    if (response.ok) { event.currentTarget.reset(); setImageUrl(""); }
  };
  return <div className="dashboard-panel merchant-product-form"><div className="panel-head"><div><p className="eyebrow">إضافة آمنة</p><h2>منتج قماش جديد</h2></div></div><p className="form-muted">سيظل المنتج غير موثق حتى تراجعه الإدارة، ولن يظهر للعميلات قبل التحقق.</p><form onSubmit={submit}><div className="merchant-form-grid"><label>اسم القماش<input name="nameAr" required placeholder="مثال: ساتان لؤلؤي" /></label><label>الرابط المختصر<input name="slug" required pattern="[a-z0-9-]{2,100}" placeholder="satin-pearl" dir="ltr" /></label><label>نوع القماش<input name="fabricType" required placeholder="ساتان" /></label><label>السعر / متر<input name="priceEgp" required type="number" min="0" step="0.01" /></label><label>المخزون بالمتر<input name="meters" required type="number" min="0" step="0.5" /></label><label>العرض بالسنتيمتر<input name="widthCm" type="number" min="1" step="1" /></label><label>الألوان مفصولة بفاصلة<input name="colors" placeholder="وردي, أسود" /></label><label className="product-upload-field">صورة المنتج<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadImage(event.target.files?.[0])} /><span><Upload aria-hidden="true" /> {uploading ? "جاري رفع الصورة..." : imageUrl ? "تم رفع الصورة" : "رفع صورة حقيقية"}</span><input name="imageUrl" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="أو ضعي رابط HTTPS" dir="ltr" /></label></div><label>الإحساس/الملمس<input name="feel" placeholder="ناعم، لامع" /></label><label>ملاحظات موثقة<textarea name="note" placeholder="تعليمات العناية أو الاستخدام" /></label>{message && <p className="form-success-inline">{message}</p>}<button className="primary" type="submit" disabled={saving || uploading}>{saving ? "جاري الحفظ..." : "حفظ المنتج للمراجعة"}</button></form></div>;
}
