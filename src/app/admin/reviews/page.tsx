import Link from "next/link";
import { connection } from "next/server";
import { ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import AdminReviewManager from "@/components/admin-review-manager";

export default async function AdminReviewsPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/admin/reviews" />;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <main dir="rtl" className="dashboard-shell dashboard-access"><div className="dashboard-access-card"><ShieldCheck aria-hidden="true" /><h1>الوصول مقيّد</h1><Link className="primary" href="/account">العودة إلى حسابي</Link></div></main>;
  const { data } = await supabase.from("reviews").select("id,rating,body,approved,created_at,fabric_products(name_ar)").order("created_at", { ascending: false });
  return <main dir="rtl" className="dashboard-shell"><header className="dashboard-header"><div><Link href="/admin" className="dashboard-inline-link">← لوحة الإدارة</Link><p className="eyebrow">صَالِح / الإدارة</p><h1>المراجعات</h1></div><span className="live-badge"><ShieldCheck aria-hidden="true" /> بيانات مباشرة</span></header><section className="admin-products-content"><AdminReviewManager initial={(data || []) as never} /></section></main>;
}
