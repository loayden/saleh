import Link from "next/link";
export default function NotFound() { return <main dir="rtl" className="route-state"><span className="route-symbol">404</span><h1>الصفحة مش موجودة</h1><p>ممكن تكون اتنقلت أو الرابط غير صحيح.</p><Link className="primary" href="/">ارجعي للرئيسية ←</Link></main>; }
