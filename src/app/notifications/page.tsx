import Link from "next/link";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import NotificationCenter from "@/components/notification-center";

export default async function NotificationsPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/notifications" />;
  const { data } = await supabase.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  return <main dir="rtl" className="account-page account-subpage"><Link href="/account">← العودة لحسابي</Link><p className="eyebrow">مساحتي / التحديثات</p><h1>الإشعارات</h1><p className="account-subtitle">كل جديد عن الطلبات، التوصيل، وطلبات التفصيل في مكان واحد.</p><NotificationCenter initial={data || []} /></main>;
}
