"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { safeAuthNext } from "@/lib/auth-redirect";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAuthNext(searchParams.get("next"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!supabase) { setMessage("إعداد Supabase غير مكتمل"); return; }
    if (password.length < 6) { setMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (password !== confirmation) { setMessage("تأكيد كلمة المرور غير مطابق"); return; }
    setBusy(true);
    const result = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() } } });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (result.data.session) { router.push(next); return; }
    setCreated(true);
    setMessage("تم إنشاء الحساب. راجعي بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.");
  };

  return <main dir="rtl" className="auth-page"><div className="auth-card signup-card"><Link className="auth-back-link" href={`/auth?next=${encodeURIComponent(next)}`}><ArrowLeft aria-hidden="true" /> العودة لتسجيل الدخول</Link><div className="signup-icon"><UserPlus aria-hidden="true" /></div><p className="eyebrow">مساحة صَالِح</p><h1>إنشاء حساب جديد</h1><p>احفظي اختياراتك، تابعي طلباتك، وابدئي تصميم القطعة التي تشبهك.</p>{created ? <div className="signup-confirmation"><CheckCircle2 aria-hidden="true" /><h2>الحساب أصبح جاهزاً</h2><p>{message}</p><Link className="primary" href={`/auth?next=${encodeURIComponent(next)}`}>العودة لتسجيل الدخول</Link></div> : <form onSubmit={submit}><label>الاسم الكامل<input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="اكتبي اسمك" /></label><label><span className="field-label"><Mail aria-hidden="true" /> البريد الإلكتروني</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="name@example.com" /></label><label><span className="field-label"><LockKeyhole aria-hidden="true" /> كلمة المرور</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="6 أحرف على الأقل" /></label><label><span className="field-label"><LockKeyhole aria-hidden="true" /> تأكيد كلمة المرور</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={6} /></label>{message && <small className="auth-message">{message}</small>}<button className="primary signup-submit" disabled={busy} type="submit">{busy ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}<UserPlus aria-hidden="true" /></button></form>}<p className="auth-footer-link">عندك حساب بالفعل؟ <Link href={`/auth?next=${encodeURIComponent(next)}`}>تسجيل الدخول</Link></p></div></main>;
}
