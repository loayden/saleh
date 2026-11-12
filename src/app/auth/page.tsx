"use client";

import { useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { authCallbackUrl, safeAuthNext } from "@/lib/auth-redirect";

export default function AuthPage() {
  const router = useRouter(), searchParams = useSearchParams();
  const next = safeAuthNext(searchParams.get("next"));
  const rememberedEmail = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => window.localStorage.getItem("saleh_auth_email") || "",
    () => "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"password" | "google" | "magic" | "resend" | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const callbackMessage = searchParams.get("error") === "confirmation_failed"
    ? "الرابط انتهت صلاحيته أو تم استخدامه من قبل. اطلبي رابط تأكيد جديدًا."
    : "";
  const visibleMessage = message || callbackMessage;

  const rememberEmail = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (normalized) window.localStorage.setItem("saleh_auth_email", normalized);
    return normalized;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setMagicSent(false);
    if (!supabase) return setMessage("إعداد Supabase غير مكتمل");
    const normalizedEmail = rememberEmail(email || rememberedEmail);
    setBusy("password");
    const result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setBusy(null);
    if (result.error) {
      const isUnconfirmed = result.error.message.toLowerCase().includes("confirm") || result.error.message.toLowerCase().includes("verified");
      setConfirmationEmail(isUnconfirmed ? normalizedEmail : "");
      setMessage(isUnconfirmed ? "لسه محتاجين تأكيد بريدك الإلكتروني قبل الدخول." : "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  const signInWithGoogle = async () => {
    setMessage("");
    if (!supabase) return setMessage("إعداد Supabase غير مكتمل");
    setBusy("google");
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: authCallbackUrl(next) } });
    if (error || !data.url) {
      setBusy(null);
      setMessage("تسجيل Google غير مفعّل في إعدادات المنصة حاليًا. جرّبي البريد أو أكملي إعداد Google في Supabase.");
      return;
    }
    window.location.assign(data.url);
  };

  const sendMagicLink = async () => {
    setMessage("");
    if (!supabase) return setMessage("إعداد Supabase غير مكتمل");
    const normalizedEmail = rememberEmail(email || rememberedEmail);
    if (!normalizedEmail) return setMessage("اكتبي بريدك الإلكتروني أولًا");
    setBusy("magic");
    const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { emailRedirectTo: authCallbackUrl(next) } });
    setBusy(null);
    if (error) return setMessage("تعذر إرسال رابط الدخول. تأكدي من إعدادات البريد وحاولي مرة أخرى.");
    setMagicSent(true);
    setMessage("اتبعتي الرابط الآمن الذي أرسلناه إلى بريدك للدخول فورًا بدون كلمة مرور.");
  };

  const resendConfirmation = async () => {
    if (!supabase || !confirmationEmail) return;
    setBusy("resend");
    const { error } = await supabase.auth.resend({ type: "signup", email: confirmationEmail, options: { emailRedirectTo: authCallbackUrl(next) } });
    setBusy(null);
    setMessage(error ? "تعذر إعادة إرسال رسالة التأكيد الآن." : "تم إرسال رسالة تأكيد جديدة. راجعي الوارد والرسائل غير المرغوب فيها.");
  };

  return <main dir="rtl" className="auth-page"><div className="auth-card auth-card-premium"><div className="auth-brand-mark"><ShieldCheck aria-hidden="true" /></div><p className="eyebrow">مساحة صَالِح</p><h1>أهلاً بيكي</h1><p>دخّلي حسابك عشان تحفظي اختياراتك وتتابعي طلباتك وتكمّلي رحلتك من آخر خطوة.</p><button className="oauth-button" disabled={busy !== null} type="button" onClick={() => void signInWithGoogle()}><span className="google-mark">G</span>{busy === "google" ? <><LoaderCircle className="spin" aria-hidden="true" /> جاري فتح Google...</> : "المتابعة باستخدام Google"}</button><div className="auth-divider"><span>أو بالبريد الإلكتروني</span></div><form onSubmit={submit}><label><span className="field-label"><Mail aria-hidden="true" /> البريد الإلكتروني</span><input type="email" autoComplete="email" inputMode="email" value={email || rememberedEmail} onChange={(e) => setEmail(e.target.value)} required /></label><label><span className="field-label"><LockKeyhole aria-hidden="true" /> كلمة المرور</span><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label><button className="primary auth-submit" disabled={busy !== null} type="submit">{busy === "password" ? <><LoaderCircle className="spin" aria-hidden="true" /> جاري التحقق...</> : <>تسجيل الدخول <ArrowLeft aria-hidden="true" /></>}</button></form><button className="magic-link-button" disabled={busy !== null} type="button" onClick={() => void sendMagicLink()}><Mail aria-hidden="true" />{busy === "magic" ? "جاري إرسال الرابط..." : "دخول سريع برابط آمن بدون كلمة مرور"}</button>{magicSent && <p className="auth-inline-success"><CheckCircle2 aria-hidden="true" /> {message}</p>}{visibleMessage && !magicSent && <small className="auth-message">{visibleMessage}</small>}{confirmationEmail && <div className="confirmation-help"><p>مش لاقية رسالة التأكيد؟</p><button type="button" disabled={busy !== null} onClick={() => void resendConfirmation()}>{busy === "resend" ? "جاري الإرسال..." : "إعادة إرسال رسالة التأكيد"}</button></div>}<div className="auth-links"><Link className="auth-secondary" href={`/auth/signup?next=${encodeURIComponent(next)}`}>إنشاء حساب جديد</Link><Link className="auth-secondary" href="/auth/forgot-password">نسيت كلمة المرور؟</Link></div><p className="auth-trust"><ShieldCheck aria-hidden="true" /> تسجيل آمن وبياناتك تفضل ملكك</p></div></main>;
}
