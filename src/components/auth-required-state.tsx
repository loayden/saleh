import Link from "next/link";
import { LogIn } from "lucide-react";

export default function AuthRequiredState({ next }: { next: string }) {
  return <main dir="rtl" className="account-page"><div className="account-empty auth-required-state"><LogIn aria-hidden="true" /><h1>تسجيل الدخول مطلوب</h1><p>سجلي الدخول عشان تفتحي هذه الصفحة وتحافظي على بياناتك بأمان.</p><Link className="primary" href={`/auth?next=${encodeURIComponent(next)}`}>تسجيل الدخول</Link></div></main>;
}
