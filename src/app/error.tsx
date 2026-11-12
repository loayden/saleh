"use client";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main dir="rtl" className="route-state"><span className="route-symbol">!</span><h1>حصلت مشكلة بسيطة</h1><p>جربي تعيدي تحميل الصفحة، ولو المشكلة استمرت تواصلي معانا.</p><button className="primary" onClick={() => reset()}>حاولي تاني</button></main>; }
