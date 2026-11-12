"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "blocked" | "error">("idle");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setState("loading"); setAnswer("");
    const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 501) { setState("blocked"); setAnswer(payload.error || "المساعد يحتاج إعداد OPENAI_API_KEY على الخادم."); return; }
    if (!response.ok) { setState("error"); setAnswer(payload.error || "تعذر إرسال السؤال."); return; }
    setState("idle"); setAnswer(payload.answer || "");
  };
  return <main dir="rtl" className="assistant-page"><header className="assistant-page-header"><Link href="/">← العودة إلى صَالِح</Link><p className="eyebrow">مساعد صَالِح</p><h1>اسألي عن القماش<br /><em>والفكرة.</em></h1><p>إجابة مبنية على الكتالوج الموثق المتاح وطلبات حسابك عند تسجيل الدخول.</p></header><section className="assistant-page-content"><div className="assistant-intro"><MessageCircle aria-hidden="true" /><h2>إيه اللي محتاجة تعرفيه؟</h2><p>اسألي عن الفرق بين خامتين، اللون، الكمية، أو حالة طلب مسجل. لن يعرض المساعد منتجاً غير موجود في المخزون.</p></div><form className="assistant-form" onSubmit={submit}><label>سؤالك<input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1200} placeholder="مثلاً: أنسب قماش لفستان سهرة مريح؟" /></label><button className="primary" type="submit" disabled={state === "loading"}>{state === "loading" ? "جاري السؤال..." : "اسألي المساعد"}<Send aria-hidden="true" /></button></form>{answer && <div className={`assistant-answer ${state === "blocked" ? "assistant-blocked" : ""}`}><Sparkles aria-hidden="true" /><p>{answer}</p></div>}</section></main>;
}
