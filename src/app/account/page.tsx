import Link from "next/link";
import { ArrowLeft, Clock3, Heart, MapPin, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import ProfileSettings from "@/components/profile-settings";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/account" />;
  const { data: profile } = await supabase.from("profiles").select("full_name,phone,avatar_url,created_at,role").eq("id", user.id).maybeSingle();
  const metadata = user.user_metadata || {};
  const fullName = profile?.full_name || metadata.full_name || metadata.name || "بيكي";
  const createdAt = profile?.created_at || user.created_at;
  const createdLabel = createdAt ? new Date(createdAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) : "";
  const isVerified = Boolean(user.email_confirmed_at);
  return <main dir="rtl" className="account-page"><div className="account-hero"><div><p className="eyebrow">مساحتي في صَالِح</p><h1>أهلاً {fullName}</h1><p>{user.email}</p></div><span className={isVerified ? "account-status verified" : "account-status"}>{isVerified ? "البريد مؤكد" : "يحتاج تأكيد البريد"}<ShieldCheck aria-hidden="true" /></span></div><div className="account-welcome"><div><strong>مساحتك جاهزة لذوقك.</strong><p>احفظي الأقمشة، تابعي طلباتك، وعدّلي بياناتك من مكان واحد.</p></div><Link className="account-shop-link" href="/fabrics">اكتشفي الأقمشة <ArrowLeft aria-hidden="true" /></Link></div><ProfileSettings initial={{ full_name: profile?.full_name || String(metadata.full_name || metadata.name || ""), phone: profile?.phone || "", avatar_url: profile?.avatar_url || "", createdLabel }} email={user.email || ""} /><div className="account-sections"><Link href="/orders"><section><h2><Clock3 aria-hidden="true" /> طلباتي</h2><p>تابعي حالة الطلبات والتفاصيل.</p><span>عرض الطلبات <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/favorites"><section><h2><Heart aria-hidden="true" /> المفضلة</h2><p>الأقمشة اللي حفظتيها لوقت تاني.</p><span>الأقمشة المحفوظة <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/addresses"><section><h2><MapPin aria-hidden="true" /> عناويني</h2><p>احفظي عناوين التوصيل.</p><span>إدارة العناوين <ArrowLeft aria-hidden="true" /></span></section></Link>{profile?.role === "admin" && <Link href="/admin"><section><h2><ShieldCheck aria-hidden="true" /> الإدارة</h2><p>إدارة المنصة والمنتجات الحقيقية.</p><span>فتح لوحة الإدارة <ArrowLeft aria-hidden="true" /></span></section></Link>}{profile?.role === "merchant" && <Link href="/merchant"><section><h2><ShieldCheck aria-hidden="true" /> لوحة التاجر</h2><p>إدارة المخزون والطلبات.</p><span>فتح لوحة التاجر <ArrowLeft aria-hidden="true" /></span></section></Link>}</div></main>;
}
