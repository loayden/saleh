"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { safeAuthNext } from "@/lib/auth-redirect";

export default function AuthPage() {
  const router = useRouter(), searchParams = useSearchParams();
  const next = safeAuthNext(searchParams.get("next"));
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!supabase) { setMessage("إعداد Supabase غير مكتمل"); return; } setBusy(true); const result = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (result.error) { setMessage(result.error.message); return; } router.push(next); };
  return <main dir="rtl" className="auth-page"><div className="auth-card"><p className="eyebrow">مساحة صَالِح</p><h1>أهلاً بيكي</h1><p>دخّلي حسابك عشان تحفظي اختياراتك وتتابعي طلباتك.</p><form onSubmit={submit}><label>البريد الإلكتروني<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>كلمة المرور<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label><button className="primary" disabled={busy} type="submit">{busy ? "جاري التحقق..." : "تسجيل الدخول"}<ArrowLeft aria-hidden="true" /></button></form><div className="auth-links"><Link className="auth-secondary" href={`/auth/signup?next=${encodeURIComponent(next)}`}>إنشاء حساب جديد</Link><Link className="auth-secondary" href="/auth/forgot-password">نسيت كلمة المرور؟</Link></div>{message && <small className="auth-message">{message}</small>}</div></main>;
}
