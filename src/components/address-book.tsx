"use client";

import { FormEvent, useState } from "react";
import { MapPin, Plus, Trash2, X } from "lucide-react";

type Address = { id: string; city: string; district: string; address_line: string; is_default: boolean };

export default function AddressBook({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: form.get("city"), district: form.get("district"), addressLine: form.get("addressLine"), isDefault: form.get("isDefault") === "on" }) });
    const payload = await response.json().catch(() => ({})); setSaving(false);
    if (!response.ok) { setMessage(payload.error || "تعذر حفظ العنوان"); return; }
    setAddresses((current) => [payload.address, ...current.map((address) => ({ ...address, is_default: payload.address.is_default ? false : address.is_default }) )]); setOpen(false); event.currentTarget.reset();
  };
  const remove = async (id: string) => { const response = await fetch("/api/addresses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (response.ok) setAddresses((current) => current.filter((address) => address.id !== id)); };
  return <><div className="address-book-head"><div><p className="eyebrow">مساحتي / عناويني</p><h1>عناويني</h1></div><button className="primary address-add" onClick={() => { setOpen(true); setMessage(""); }}><Plus aria-hidden="true" /> إضافة عنوان</button></div>{addresses.length ? <div className="addresses-list">{addresses.map((address) => <article key={address.id}><strong><MapPin aria-hidden="true" /> {address.city} · {address.district}</strong><p>{address.address_line}</p><div><small>{address.is_default ? "العنوان الأساسي" : "عنوان محفوظ"}</small><button onClick={() => remove(address.id)} aria-label="حذف العنوان"><Trash2 aria-hidden="true" /> حذف</button></div></article>)}</div> : <div className="account-empty"><MapPin aria-hidden="true" /><h2>لسه مفيش عناوين محفوظة</h2><p>أضيفي عنوانك الآن لاستخدامه في الطلبات القادمة.</p><button className="primary" onClick={() => setOpen(true)}><Plus aria-hidden="true" /> إضافة أول عنوان</button></div>}{open && <div className="overlay" onClick={() => setOpen(false)}><form className="address-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}><button type="button" className="close" onClick={() => setOpen(false)} aria-label="إغلاق"><X aria-hidden="true" /></button><p className="eyebrow">عنوان جديد</p><h2>فين نوصّل لك؟</h2><label>المحافظة<select name="city" defaultValue="القاهرة"><option>القاهرة</option><option>الإسكندرية</option></select></label><label>المنطقة<input name="district" required placeholder="مثال: المعادي" /></label><label>العنوان بالتفصيل<textarea name="addressLine" required placeholder="الشارع، رقم العقار، الدور، الشقة" /></label><label className="checkbox-label"><input type="checkbox" name="isDefault" /> اجعلي هذا العنوان أساسياً</label>{message && <p className="form-error">{message}</p>}<button className="primary" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ العنوان"}</button></form></div>}</>;
}
