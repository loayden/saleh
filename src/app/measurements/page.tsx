import Link from "next/link";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import MeasurementBook from "@/components/measurement-book";

export default async function MeasurementsPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/measurements" />;
  const { data } = await supabase.from("measurement_profiles").select("id,name,measurements,notes").eq("user_id", user.id).order("updated_at", { ascending: false });
  return <main dir="rtl" className="account-page account-subpage"><Link href="/account">← العودة لحسابي</Link><p className="eyebrow">مساحتي / المقاسات</p><h1>مقاساتي</h1><p className="account-subtitle">ملفات خاصة بحسابك تساعد فريق التفصيل يجهز طلبك بدقة.</p><MeasurementBook initial={(data || []) as { id: string; name: string; measurements: Record<string, string>; notes: string | null }[]} /></main>;
}
