"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MapPin, Scissors, Send, ShieldCheck, X } from "lucide-react";

type Tailor = { id: string; name_ar: string; city: string; district: string | null; verified: boolean };

export default function TailorsPage() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [city, setCity] = useState("الكل");
  const [selected, setSelected] = useState<Tailor | null | undefined>(undefined);
  const [sentId, setSentId] = useState("");
  const [formError, setFormError] = useState("");
  const visible = useMemo(() => city === "الكل" ? tailors : tailors.filter((tailor) => tailor.city === city), [city, tailors]);

  useEffect(() => {
    fetch("/api/tailors")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("tailors")))
      .then((payload: { data?: Tailor[] }) => { setTailors(payload.data || []); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tailoring-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tailorId: selected?.id, customerName: form.get("customerName"), phone: form.get("phone"), city: form.get("city"), district: form.get("district"), addressLine: form.get("addressLine"), heightCm: Number(form.get("heightCm")), fabricColor: form.get("fabricColor"), requestedMeters: Number(form.get("requestedMeters")), garmentType: form.get("garmentType"), details: form.get("details") }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setFormError(payload.error || "تعذر إرسال الطلب"); return; }
    setSentId(payload.request?.id || "");
  };

  return <main dir="rtl" className="tailors-page"><header className="tailors-hero"><Link href="/" className="back-link">← العودة إلى صَالِح</Link><p className="eyebrow">خلي تصميمك حقيقة</p><h1>من الفكرة<br /><em>للقطعة.</em></h1><p>نُظهر هنا فقط الخيّاطات التي تم التحقق منها داخل قاعدة البيانات.</p></header><section className="tailors-content"><div className="tailors-toolbar"><div><p className="eyebrow">شركاء التفصيل</p><h2>اختاري اللي يناسبك</h2></div><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="تصفية حسب المدينة"><option>الكل</option><option>القاهرة</option><option>الإسكندرية</option></select></div>{state === "loading" && <div className="tailor-state"><Scissors aria-hidden="true" /><p>بنحمّل الخيّاطات الموثقات...</p></div>}{state === "error" && <div className="tailor-state"><ShieldCheck aria-hidden="true" /><h2>تعذر تحميل القائمة</h2><p>الخدمة لم تستطع قراءة بيانات الخيّاطات حالياً.</p></div>}{state === "ready" && visible.length === 0 && <div className="tailor-state"><Scissors aria-hidden="true" /><h2>لا توجد خيّاطات موثقات بعد</h2><p>لن نعرض ملفات أو صوراً غير معتمدة. يمكنك إرسال طلب عام للإدارة.</p><button className="primary" onClick={() => { setSelected(null); setSentId(""); }}>اعملي طلب تفصيل عام <Send aria-hidden="true" /></button></div>}{visible.length > 0 && <div className="tailor-grid">{visible.map((tailor) => <article className="tailor-card tailor-live-card" key={tailor.id}><div className="tailor-card-mark"><Scissors aria-hidden="true" /></div><div><span className="verified-chip"><ShieldCheck aria-hidden="true" /> موثقة</span><h3>{tailor.name_ar}</h3><p><MapPin aria-hidden="true" />{tailor.city}{tailor.district ? ` · ${tailor.district}` : ""}</p><button onClick={() => { setSelected(tailor); setSentId(""); setFormError(""); }}>اطلبي عرض سعر <Send aria-hidden="true" /></button></div></article>)}</div>}<div className="tailor-note"><strong>مش لاقية الاختيار المناسب؟</strong><span>ابعتي تفاصيل القطعة للإدارة، وسيتم التعامل معها كطلب حقيقي للمراجعة والتنسيق.</span><button onClick={() => { setSelected(null); setSentId(""); setFormError(""); }}>اعملي طلب عام <Send aria-hidden="true" /></button></div></section>{selected !== undefined && <div className="overlay" onClick={() => setSelected(undefined)}><form className="tailor-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}><button type="button" className="close" onClick={() => setSelected(undefined)} aria-label="إغلاق"><X aria-hidden="true" /></button>{sentId ? <div className="form-success"><CheckCircle2 aria-hidden="true" /><h2>تم إرسال طلبك</h2><p>تم حفظ الطلب برقم <strong dir="ltr">{sentId.slice(0, 8)}</strong>. سيراجعه فريق صَالِح ويتواصل معك على الرقم المدخل.</p><button type="button" className="primary" onClick={() => setSelected(undefined)}>تم</button></div> : <><p className="eyebrow">{selected ? `طلب إلى ${selected.name_ar}` : "طلب تفصيل عام"}</p><h2>احكي لنا عن القطعة</h2><p className="form-muted">كل البيانات تُرسل إلى قاعدة الطلبات لمراجعتها من الفريق.</p><div className="tailor-form-grid"><label>اسمك<input required name="customerName" placeholder="اكتبي اسمك" /></label><label>رقم الموبايل<input required name="phone" inputMode="tel" placeholder="01xxxxxxxxx" /></label><label>المدينة<select required name="city"><option>القاهرة</option><option>الإسكندرية</option></select></label><label>المنطقة<input required name="district" placeholder="المنطقة" /></label><label>العنوان<input required name="addressLine" placeholder="العنوان بالتفصيل" /></label><label>الطول بالسنتيمتر<input required name="heightCm" type="number" min="80" max="250" defaultValue="165" /></label><label>اللون المطلوب<input required name="fabricColor" placeholder="مثلاً: أسود" /></label><label>عدد الأمتار<input required name="requestedMeters" type="number" min="0.5" step="0.5" defaultValue="3" /></label></div><label>نوع القطعة<input required name="garmentType" placeholder="فستان سهرة، عباية، بدلة..." /></label><label>تفاصيل التصميم<textarea required name="details" placeholder="المقاس، المناسبة، الموعد، وأي تفاصيل مهمة" /></label>{formError && <p className="form-error">{formError}</p>}<button className="primary" type="submit">إرسال الطلب <Send aria-hidden="true" /></button><small className="form-disclaimer">سيتم التواصل بعد مراجعة التوفر، ولا يتم تأكيد سعر التفصيل قبل المراجعة.</small></>}</form></div>}</main>;
}
