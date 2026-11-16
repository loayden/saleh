import Link from "next/link";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import MessageCenter from "@/components/message-center";

export default async function MessagesPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/messages" />;
  const { data } = await supabase.from("support_conversations").select("id,subject,status,order_id,tailoring_request_id,created_at,updated_at").eq("customer_id", user.id).order("updated_at", { ascending: false });
  return <main dir="rtl" className="account-page account-subpage"><Link href="/account">← العودة لحسابي</Link><p className="eyebrow">مساحتي / الدعم</p><h1>الرسائل</h1><p className="account-subtitle">تواصلي مع فريق صَالِح بخصوص طلب أو تصميم أو أي سؤال قبل الشراء.</p><MessageCenter initial={data || []} currentUserId={user.id} /></main>;
}
