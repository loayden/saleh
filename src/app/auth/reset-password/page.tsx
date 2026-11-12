"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (password.length < 8) return setMessage("استخدمي 8 أحرف على الأقل");
    if (password !== confirmation) return setMessage("تأكيد كلمة المرور غير مطابق");
    if (!supabase) return setMessage("إعداد Supabase غير مكتمل");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage("انتهت صلاحية الرابط أو تعذر تغيير كلمة المرور");
    await supabase.auth.signOut(); setDone(true);
  };
  return <main dir="rtl" className="auth-page"><div className="auth-card signup-card"><p className="eyebrow">أمان حسابك</p><h1>كلمة مرور جديدة</h1>{done ? <div className="signup-confirmation"><CheckCircle2 aria-hidden="true" /><h2>تم تحديث كلمة المرور</h2><p>سجّلي الدخول الآن باستخدام كلمة المرور الجديدة.</p><Link className="primary" href="/auth">تسجيل الدخول</Link></div> : <form onSubmit={submit}><label><span className="field-label"><LockKeyhole aria-hidden="true" /> كلمة المرور الجديدة</span><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label><span className="field-label"><LockKeyhole aria-hidden="true" /> تأكيد كلمة المرور</span><input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>{message && <small className="auth-message">{message}</small>}<button className="primary signup-submit" disabled={busy} type="submit">{busy ? "جاري التحديث..." : "حفظ كلمة المرور"}</button></form>}</div></main>;
}
