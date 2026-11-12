"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileImage, ImagePlus, LockKeyhole, Palette, RefreshCw, Sparkles, X } from "lucide-react";

type Fabric = { id: string; slug: string; name: string; type: string; image: string | null; colors?: string[] };

export default function VisualizerPage() {
  const [inspiration, setInspiration] = useState<string | null>(null);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [modification, setModification] = useState("أكمام طويلة");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [analysisState, setAnalysisState] = useState<"idle" | "loading" | "blocked" | "error">("idle");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedLabel, setGeneratedLabel] = useState("");

  useEffect(() => {
    fetch("/api/fabrics?available=true")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog")))
      .then((payload: { data?: Fabric[] }) => { const available = payload.data || []; setFabrics(available); setFabric(available[0] || null); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  const upload = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) { setAnalysisMessage("اختاري صورة بصيغة مدعومة."); return; }
    if (file.size > 8 * 1024 * 1024) { setAnalysisMessage("حجم الصورة يجب أن يكون أقل من 8MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setInspiration(String(reader.result)); setGeneratedImage(null); setGeneratedLabel(""); setAnalysisMessage(""); setAnalysisState("idle"); };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!inspiration || !fabric) { setAnalysisMessage("ارفعي صورة واختاري قماشاً متاحاً أولاً."); return; }
    setAnalysisState("loading"); setAnalysisMessage("");
    const response = await fetch("/api/inspiration/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData: inspiration, fabricSlug: fabric.slug, modification }) });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 501) { setAnalysisState("blocked"); setAnalysisMessage(payload.message || payload.error || "تحليل الصور يحتاج إعداد مزود الذكاء الاصطناعي على الخادم."); return; }
    if (!response.ok) { setAnalysisState("error"); setAnalysisMessage(payload.error || "تعذر تحليل الصورة."); return; }
    const summary = payload.data?.analysis?.style_summary || "تم تحليل صورة الإلهام مقابل المنتجات المتاحة.";
    setAnalysisMessage(summary);
    const generated = await fetch("/api/inspiration/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData: inspiration, fabric: { name: fabric.name, type: fabric.type, color: fabric.colors?.[0] || "", feel: "" }, modification }) });
    const generatedPayload = await generated.json().catch(() => ({}));
    if (generated.ok && generatedPayload.imageData) { setGeneratedImage(generatedPayload.imageData); setGeneratedLabel(generatedPayload.label || "معاينة مولدة بالذكاء الاصطناعي — فكرة تقريبية"); }
    setAnalysisState("idle");
  };

  return <main dir="rtl" className="visualizer-page"><header className="visualizer-header"><Link href="/">← العودة إلى صَالِح</Link><p className="eyebrow">استوديو صَالِح</p><h1>شوفي تصميمك<br /><em>قبل ما يبدأ.</em></h1><p>ارفعي صورة إلهام واختاري قماشاً من المخزون الحقيقي. التحليل المرئي لا يعمل إلا بعد إعداد مزود الذكاء الاصطناعي.</p></header><section className="visualizer-workspace"><div className="visualizer-steps"><span className="current">01 <b>الإلهام</b></span><span>02 <b>القماش</b></span><span>03 <b>تحليل حقيقي</b></span></div><div className="visualizer-grid"><div className="inspiration-panel"><h2><FileImage aria-hidden="true" /> صورة التصميم</h2><p>ارفعي صورة الفستان أو لقطة الإلهام.</p>{inspiration ? <div className="preview-box"><img src={inspiration} alt="صورة الإلهام" /><button onClick={() => { setInspiration(null); setGeneratedImage(null); setAnalysisState("idle"); }}><X aria-hidden="true" /> تغيير الصورة</button></div> : <label className="upload-box"><ImagePlus aria-hidden="true" /><strong>ارفعي صورة هنا</strong><small>PNG أو JPG حتى 8MB</small><input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} /></label>}<small className="privacy-note"><LockKeyhole aria-hidden="true" /> لا يتم إرسال الصورة لمزود خارجي قبل تفعيل الإعداد من الخادم.</small></div><div className="fabric-panel"><h2><Palette aria-hidden="true" /> اختاري القماش</h2><p>هذه القائمة تُقرأ من المنتجات الموثقة والمتاحة فقط.</p>{state === "loading" && <div className="visualizer-state">بنحمّل الأقمشة المتاحة...</div>}{state === "error" && <div className="visualizer-state">تعذر تحميل الأقمشة من Supabase.</div>}{state === "ready" && fabrics.length === 0 && <div className="visualizer-state"><p>لا توجد أقمشة متاحة للتحليل الآن.</p><Link href="/shop">افتحي المتجر</Link></div>}{fabrics.length > 0 && <><div className="visual-fabrics">{fabrics.map((item) => <button className={fabric?.id === item.id ? "selected" : ""} key={item.id} onClick={() => setFabric(item)}>{item.image ? <img src={item.image} alt={item.name} /> : <span className="visual-fabric-empty">صورة غير مضافة</span>}<span>{item.name}</span><small>{item.type}</small></button>)}</div><label className="mod-label">تفصيل مطلوب<select value={modification} onChange={(event) => setModification(event.target.value)}><option>أكمام طويلة</option><option>ياقة مرتفعة</option><option>قصة أكثر اتساعاً</option><option>بدون تعديل</option></select></label><button className="primary generate" onClick={analyze} disabled={analysisState === "loading"}>{analysisState === "loading" ? <><RefreshCw aria-hidden="true" /> جاري التحليل...</> : <><Sparkles aria-hidden="true" /> ابدئي التحليل الحقيقي</>}</button></>}</div></div><div className={`visual-result ${analysisState !== "idle" ? "is-generated" : ""}`}><div className="result-art">{generatedImage ? <><img src={generatedImage} alt="معاينة مولدة لفكرة التصميم" /><span className="result-overlay"><strong>مفهوم تقريبي</strong><small>{generatedLabel}</small></span></> : inspiration ? <img src={inspiration} alt="صورة الإلهام المختارة" /> : <div className="result-placeholder"><ImagePlus aria-hidden="true" /><p>المعاينة ستظهر هنا بعد رفع الصورة</p></div>}</div><div className="result-copy"><p className="eyebrow">حالة الاستوديو</p><h2>{analysisState === "blocked" ? "التحليل متوقف مؤقتاً." : analysisState === "error" ? "لم يكتمل التحليل." : generatedImage ? "دي فكرة أولى." : "خلي الفكرة تكبر."}</h2><p>{analysisMessage || "الاستوديو لا ينشئ صورة تركيبية من تلقاء نفسه. يعرض الإلهام فقط إلى أن يتصل مزود ذكاء اصطناعي فعلي."}</p>{analysisState === "blocked" && <div className="dependency-note"><Sparkles aria-hidden="true" /><span>الحالة: BLOCKED — DEPENDENCY REQUIRED<br />يجب ضبط OPENAI_API_KEY قبل تشغيل تحليل الصور والمعاينة.</span></div>}{fabric && <Link className="primary" href={`/tailoring/${fabric.slug}`}>ابدئي طلب تفصيل حقيقي <span>←</span></Link>}</div></div></section></main>;
}
