import Link from "next/link";
import { connection } from "next/server";
import { ShieldCheck, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";

export default async function AdminCustomersPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/admin/customers" />;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <main dir="rtl" className="dashboard-shell dashboard-access"><div className="dashboard-access-card"><ShieldCheck aria-hidden="true" /><h1>الوصول مقيّد</h1><Link className="primary" href="/account">العودة إلى حسابي</Link></div></main>;
  const [{ data: profiles }, { data: orders }] = await Promise.all([supabase.from("profiles").select("id,full_name,phone,role,created_at").order("created_at", { ascending: false }), supabase.from("orders").select("user_id")]);
  const counts = (orders || []).reduce<Record<string, number>>((result, order) => { if (order.user_id) result[order.user_id] = (result[order.user_id] || 0) + 1; return result; }, {});
  return <main dir="rtl" className="dashboard-shell"><header className="dashboard-header"><div><Link href="/admin" className="dashboard-inline-link">← لوحة الإدارة</Link><p className="eyebrow">صَالِح / الإدارة</p><h1>العملاء</h1></div><span className="live-badge"><ShieldCheck aria-hidden="true" /> بيانات مباشرة</span></header><section className="admin-products-content"><div className="dashboard-panel"><div className="panel-head"><div><p className="eyebrow">الحسابات</p><h2>العملاء المسجلون</h2></div></div>{profiles?.length ? <div className="dashboard-table-wrap"><table><thead><tr><th>الاسم</th><th>الهاتف</th><th>الدور</th><th>الطلبات</th><th>تاريخ التسجيل</th></tr></thead><tbody>{profiles.map((customer) => <tr key={customer.id}><td><strong>{customer.full_name || "بدون اسم"}</strong></td><td>{customer.phone || "—"}</td><td>{customer.role}</td><td>{(counts[customer.id] || 0).toLocaleString("ar-EG")}</td><td>{new Date(customer.created_at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</td></tr>)}</tbody></table></div> : <div className="dashboard-empty"><Users aria-hidden="true" /><p>لا توجد حسابات.</p></div>}</div></section></main>;
}
