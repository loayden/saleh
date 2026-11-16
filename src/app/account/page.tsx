import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, Bell, CheckCircle2, Clock3, Heart, MapPin, MessageCircle, Ruler, Scissors, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import ProfileSettings from "@/components/profile-settings";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/account" />;
  const [{ data: profile }, { count: orderCount }, { count: favoriteCount }, { count: notificationCount }, { count: measurementCount }, { count: tailoringCount }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,avatar_url,created_at,role").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("wishlists").select("product_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    supabase.from("measurement_profiles").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("tailoring_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const metadata = user.user_metadata || {};
  const fullName = profile?.full_name || metadata.full_name || metadata.name || "بيكي";
  const createdAt = profile?.created_at || user.created_at;
  const createdLabel = createdAt ? new Date(createdAt).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) : "";
  const isVerified = Boolean(user.email_confirmed_at);
  const { welcome } = await searchParams;
  return <main dir="rtl" className="account-page"><div className="account-hero"><div><p className="eyebrow">مساحتي في صَالِح</p><h1>أهلاً {fullName}</h1><p>{user.email}</p></div><span className={isVerified ? "account-status verified" : "account-status"}>{isVerified ? "البريد مؤكد" : "يحتاج تأكيد البريد"}<ShieldCheck aria-hidden="true" /></span></div>{welcome === "1" && <div className="account-first-welcome" role="status"><div className="account-first-welcome-icon"><CheckCircle2 aria-hidden="true" /></div><div><strong>أهلاً بيكي يا {fullName} ✨</strong><p>تم تسجيل دخولك بنجاح. حسابك جاهز، وكل اختياراتك هتفضل محفوظة هنا.</p></div></div>}<div className="account-welcome"><div><strong>مساحتك جاهزة لذوقك.</strong><p>احفظي الأقمشة، تابعي طلباتك، وعدّلي بياناتك من مكان واحد.</p></div><Link className="account-shop-link" href="/fabrics">اكتشفي الأقمشة <ArrowLeft aria-hidden="true" /></Link></div><div className="account-metrics"><Link href="/orders"><strong>{orderCount ?? 0}</strong><span>طلب</span></Link><Link href="/favorites"><strong>{favoriteCount ?? 0}</strong><span>مفضلة</span></Link><Link href="/notifications"><strong>{notificationCount ?? 0}</strong><span>إشعار جديد</span></Link><Link href="/measurements"><strong>{measurementCount ?? 0}</strong><span>ملف مقاسات</span></Link></div><ProfileSettings initial={{ full_name: profile?.full_name || String(metadata.full_name || metadata.name || ""), phone: profile?.phone || "", avatar_url: profile?.avatar_url || "", createdLabel }} email={user.email || ""} /><div className="account-sections"><Link href="/orders"><section><h2><Clock3 aria-hidden="true" /> طلباتي <small>{orderCount ?? 0}</small></h2><p>تابعي حالة الطلبات والتفاصيل.</p><span>عرض الطلبات <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/favorites"><section><h2><Heart aria-hidden="true" /> المفضلة <small>{favoriteCount ?? 0}</small></h2><p>الأقمشة اللي حفظتيها لوقت تاني.</p><span>الأقمشة المحفوظة <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/addresses"><section><h2><MapPin aria-hidden="true" /> عناويني</h2><p>احفظي عناوين التوصيل.</p><span>إدارة العناوين <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/measurements"><section><h2><Ruler aria-hidden="true" /> مقاساتي <small>{measurementCount ?? 0}</small></h2><p>ملفات جاهزة لطلبات التفصيل القادمة.</p><span>إدارة المقاسات <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/tailoring-requests"><section><h2><Scissors aria-hidden="true" /> طلبات التفصيل <small>{tailoringCount ?? 0}</small></h2><p>تابعي التصميم والتسعير والمراجعة.</p><span>عرض طلبات التفصيل <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/messages"><section><h2><MessageCircle aria-hidden="true" /> الرسائل</h2><p>تواصلي مع فريق صَالِح بخصوص طلباتك.</p><span>فتح الرسائل <ArrowLeft aria-hidden="true" /></span></section></Link><Link href="/notifications"><section><h2><Bell aria-hidden="true" /> الإشعارات <small>{notificationCount ?? 0}</small></h2><p>تحديثات الطلبات وطلبات التفصيل.</p><span>فتح الإشعارات <ArrowLeft aria-hidden="true" /></span></section></Link>{profile?.role === "admin" && <Link href="/admin"><section><h2><ShieldCheck aria-hidden="true" /> الإدارة</h2><p>إدارة المنصة والمنتجات الحقيقية.</p><span>فتح لوحة الإدارة <ArrowLeft aria-hidden="true" /></span></section></Link>}{profile?.role === "merchant" && <Link href="/merchant"><section><h2><ShieldCheck aria-hidden="true" /> لوحة التاجر</h2><p>إدارة المخزون والطلبات.</p><span>فتح لوحة التاجر <ArrowLeft aria-hidden="true" /></span></section></Link>}</div></main>;
}
