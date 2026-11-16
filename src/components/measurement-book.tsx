"use client";

import { useState } from "react";
import { Ruler, Trash2 } from "lucide-react";

type MeasurementProfile = { id: string; name: string; measurements: Record<string, string>; notes: string | null };
const fields = [["bust", "محيط الصدر"], ["waist", "محيط الوسط"], ["hips", "محيط الأرداف"], ["shoulder", "عرض الكتف"], ["sleeve", "طول الكم"], ["length", "طول القطعة"]];

export default function MeasurementBook({ initial }: { initial: MeasurementProfile[] }) {
  const [profiles, setProfiles] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const measurements = Object.fromEntries(fields.map(([key]) => [key, String(form.get(key) || "").trim()]).filter(([, value]) => value));
    const response = await fetch("/api/measurements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), measurements, notes: form.get("notes") }) });
    const payload = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(payload.error || "تعذر حفظ المقاسات");
    setProfiles((current) => [payload.data as MeasurementProfile, ...current]); event.currentTarget.reset(); setMessage("اتحفظ ملف المقاسات في حسابك.");
  };

  const remove = async (id: string) => {
    const response = await fetch("/api/measurements", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setProfiles((current) => current.filter((profile) => profile.id !== id)); else setMessage("تعذر حذف الملف");
  };

  return <div className="measurement-book"><div className="measurement-book-intro"><Ruler aria-hidden="true" /><div><p className="eyebrow">مقاساتي المحفوظة</p><h2>خلي كل تصميم أسهل.</h2><p>احفظي المقاسات بالسنتيمتر لاستخدامها مع طلبات التفصيل القادمة. تقدري تعدليها أو تحذفيها في أي وقت.</p></div></div><form className="measurement-form" onSubmit={submit}><label>اسم الملف<input name="name" required placeholder="مثال: مقاسي الأساسي" /></label><div className="measurement-fields">{fields.map(([key, label]) => <label key={key}>{label} بالسنتيمتر<input name={key} inputMode="decimal" type="number" min="1" max="300" step="0.5" placeholder="—" /></label>)}</div><label>ملاحظات إضافية<textarea name="notes" maxLength={500} placeholder="أي تفاصيل تحبي تفتكريها..." /></label>{message && <p className="form-success-inline" role="status">{message}</p>}<button className="primary" disabled={busy} type="submit">{busy ? "جاري الحفظ..." : "حفظ ملف المقاسات"}</button></form><div className="measurement-list">{profiles.length ? profiles.map((profile) => <article key={profile.id}><div><strong>{profile.name}</strong><div className="measurement-chips">{Object.entries(profile.measurements).map(([key, value]) => <span key={key}>{fields.find(([field]) => field === key)?.[1] || key}: {value} سم</span>)}</div>{profile.notes && <p>{profile.notes}</p>}</div><button type="button" onClick={() => void remove(profile.id)} aria-label={`حذف ${profile.name}`}><Trash2 aria-hidden="true" /></button></article>) : <div className="account-empty"><Ruler aria-hidden="true" /><h3>لسه مفيش مقاسات محفوظة</h3><p>احفظي أول ملف عشان نستخدمه وقت التفصيل.</p></div>}</div></div>;
}
