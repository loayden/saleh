"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Mail, ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { safeAuthNext } from "@/lib/auth-redirect";

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAuthNext(searchParams.get("next"));
  const [state, setState] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("بنراجع التأكيد ونجهّز حسابك...");

  useEffect(() => {
    let cancelled = false;
    const finish = async () => {
      if (!supabase) {
        if (!cancelled) { setState("error"); setMessage("إعداد Supabase غير مكتمل."); }
        return;
      }

      const errorParam = searchParams.get("error");
      if (errorParam) {
        if (!cancelled) { setState("error"); setMessage("الرابط انتهت صلاحيته أو تم استخدامه من قبل. اطلبي رسالة جديدة."); }
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      if (tokenHash) {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
        if (result.error) {
          if (!cancelled) { setState("error"); setMessage("تعذر تأكيد البريد بهذا الرابط. اطلبي رسالة تأكيد جديدة."); }
          return;
        }
      }

      const code = searchParams.get("code");
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        if (result.error) {
          if (!cancelled) { setState("error"); setMessage("تعذر إكمال تسجيل الدخول. اطلبي رابطًا جديدًا."); }
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (!cancelled) {
          setState("success");
          setMessage("تم تأكيد بريدك. لحظات ونفتح حسابك...");
          window.setTimeout(() => router.replace(next), 650);
        }
        return;
      }

      if (!cancelled) {
        setState("error");
        setMessage("لم نقدر نلاقي جلسة مؤكدة. افتحي الرابط من نفس الجهاز أو اطلبي رسالة جديدة.");
      }
    };

    void finish();
    return () => { cancelled = true; };
  }, [next, router, searchParams]);

  return <main dir="rtl" className="auth-page auth-confirm-page"><div className="auth-card auth-card-premium auth-confirm-card"><div className={state === "error" ? "auth-brand-mark auth-brand-mark-error" : "auth-brand-mark"}>{state === "error" ? <ShieldAlert aria-hidden="true" /> : state === "success" ? <CheckCircle2 aria-hidden="true" /> : <Mail aria-hidden="true" />}</div><p className="eyebrow">تأكيد آمن من صَالِح</p><h1>{state === "success" ? "أهلاً بيكي" : state === "error" ? "نحتاج محاولة جديدة" : "بنجهّز حسابك"}</h1><p>{message}</p>{state === "checking" && <LoaderCircle className="auth-loading-icon spin" aria-label="جاري التحقق" />}{state === "success" && <div className="auth-confirm-success"><CheckCircle2 aria-hidden="true" /> بريدك الإلكتروني مؤكد وحسابك جاهز.</div>}{state === "error" && <div className="auth-confirm-actions"><Link className="primary" href={`/auth?next=${encodeURIComponent(next)}`}>العودة لتسجيل الدخول</Link><Link className="auth-secondary" href={`/auth/signup?next=${encodeURIComponent(next)}`}>إنشاء حساب جديد</Link></div>}</div></main>;
}
