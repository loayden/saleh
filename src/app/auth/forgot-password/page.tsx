"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    if (!supabase) { setBusy(false); return setMessage("إعداد Supabase غير مكتمل"); }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` });
    setBusy(false);
    if (error) return setMessage("تعذر إرسال رابط الاستعادة، تأكدي من البريد وحاولي مرة أخرى");
    setSent(true); setMessage("لو الحساب موجود، هيوصلك رابط آمن على بريدك الإلكتروني.");
  };
  return <main dir="rtl" className="auth-page"><div className="auth-card signup-card"><Link className="auth-back-link" href="/auth"><ArrowLeft aria-hidden="true" /> العودة لتسجيل الدخول</Link><div className="signup-icon"><Mail aria-hidden="true" /></div><p className="eyebrow">أمان حسابك</p><h1>استعادة كلمة المرور</h1><p>اكتبي بريدك وسنرسل لك رابطاً آمناً لتعيين كلمة مرور جديدة.</p>{sent ? <div className="signup-confirmation"><Send aria-hidden="true" /><h2>راجعي بريدك</h2><p>{message}</p><Link className="primary" href="/auth">العودة لتسجيل الدخول</Link></div> : <form onSubmit={submit}><label>البريد الإلكتروني<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{message && <small className="auth-message">{message}</small>}<button className="primary signup-submit" disabled={busy} type="submit">{busy ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}<Send aria-hidden="true" /></button></form>}</div></main>;
}
