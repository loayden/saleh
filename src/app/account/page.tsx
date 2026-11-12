import Link from "next/link";
import { Clock3, Heart, MapPin, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import ProfileSettings from "@/components/profile-settings";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/account" />;
  const { data: profile } = await supabase.from("profiles").select("full_name,phone,avatar_url,created_at,role").eq("id", user.id).maybeSingle();
  const createdLabel = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) : "";
  return <main dir="rtl" className="account-page"><p className="eyebrow">مساحتي</p><h1>أهلاً {profile?.full_name || "بيكي"}</h1><p>{user.email}</p><ProfileSettings initial={{ full_name: profile?.full_name || "", phone: profile?.phone || "", avatar_url: profile?.avatar_url || "", createdLabel }} email={user.email || ""} /><div className="account-sections"><Link href="/orders"><section><h2><Clock3 aria-hidden="true" /> طلباتي</h2><p>تابعي حالة الطلبات والتفاصيل.</p></section></Link><Link href="/favorites"><section><h2><Heart aria-hidden="true" /> المفضلة</h2><p>الأقمشة اللي حفظتيها لوقت تاني.</p></section></Link><Link href="/addresses"><section><h2><MapPin aria-hidden="true" /> عناويني</h2><p>احفظي عناوين التوصيل.</p></section></Link>{profile?.role === "admin" && <Link href="/admin"><section><h2><ShieldCheck aria-hidden="true" /> الإدارة</h2><p>إدارة المنصة والمنتجات الحقيقية.</p></section></Link>}{profile?.role === "merchant" && <Link href="/merchant"><section><h2><ShieldCheck aria-hidden="true" /> لوحة التاجر</h2><p>إدارة المخزون والطلبات.</p></section></Link>}</div></main>;
}
