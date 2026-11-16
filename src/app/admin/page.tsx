import Link from "next/link";
import { connection } from "next/server";
import { BarChart3, CircleAlert, Database, ExternalLink, PackageSearch, Scissors, ShieldCheck, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";

export default async function AdminPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/admin" />;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <main dir="rtl" className="dashboard-shell dashboard-access"><div className="dashboard-access-card"><ShieldCheck aria-hidden="true" /><p className="eyebrow">صَالِح / صلاحيات الإدارة</p><h1>الوصول مقيّد</h1><p>هذه الشاشة لا تفتح إلا للحسابات التي تحمل دور admin في Supabase.</p><Link className="primary" href="/account">العودة إلى حسابي</Link></div></main>;

  const [orders, products, tailors, customers, inventory, tailoring] = await Promise.all([
    supabase.from("orders").select("city,status,subtotal_egp", { count: "exact", head: false }),
    supabase.from("fabric_products").select("id", { count: "exact", head: true }),
    supabase.from("tailors").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("inventory").select("product_id,meters").lt("meters", 10),
    supabase.from("tailoring_requests").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing", "quoted"]),
  ]);
  const cityCounts = (orders.data || []).reduce<Record<string, number>>((acc, order) => { acc[order.city] = (acc[order.city] || 0) + 1; return acc; }, {});
  const orderCount = orders.count ?? 0;
  const revenue = (orders.data || []).reduce((sum, order) => sum + Number(order.subtotal_egp || 0), 0);
  const activeOrderCount = (orders.data || []).filter((order) => !["delivered", "cancelled", "returned"].includes(order.status)).length;

  return <main dir="rtl" className="dashboard-shell"><header className="dashboard-header"><div><p className="eyebrow">صَالِح / المنصة</p><h1>نظرة عامة</h1><small className="dashboard-subtitle">{user.email}</small></div><span className="live-badge"><ShieldCheck aria-hidden="true" /> بيانات مباشرة</span></header><section className="admin-grid"><div className="admin-card"><Database aria-hidden="true" /><small>إجمالي الطلبات</small><strong>{orderCount.toLocaleString("ar-EG")}</strong><span>من Supabase</span></div><div className="admin-card"><BarChart3 aria-hidden="true" /><small>قيمة المبيعات</small><strong>{revenue.toLocaleString("ar-EG")} ج.م</strong><span>قبل التوصيل</span></div><div className="admin-card"><PackageSearch aria-hidden="true" /><small>طلبات نشطة</small><strong>{activeOrderCount.toLocaleString("ar-EG")}</strong><span>تحتاج متابعة</span></div><div className="admin-card"><Users aria-hidden="true" /><small>العملاء</small><strong>{(customers.count ?? 0).toLocaleString("ar-EG")}</strong><span>حسابات مسجلة</span></div><div className="admin-card"><BarChart3 aria-hidden="true" /><small>المنتجات</small><strong>{(products.count ?? 0).toLocaleString("ar-EG")}</strong><span>مسجلة في الكتالوج</span></div><div className="admin-card"><PackageSearch aria-hidden="true" /><small>مخزون منخفض</small><strong>{(inventory.data || []).length.toLocaleString("ar-EG")}</strong><span>أقل من 10 متر</span></div><div className="admin-card"><Scissors aria-hidden="true" /><small>تفصيل قيد المراجعة</small><strong>{(tailoring.count ?? 0).toLocaleString("ar-EG")}</strong><span>طلبات حقيقية</span></div><div className="admin-card"><ShieldCheck aria-hidden="true" /><small>الخيّاطات</small><strong>{(tailors.count ?? 0).toLocaleString("ar-EG")}</strong><span>ملفات في قاعدة البيانات</span></div><div className="dashboard-panel admin-wide"><div className="panel-head"><div><p className="eyebrow">الأداء</p><h2>الطلبات حسب المدينة</h2></div><div className="admin-dashboard-links"><Link href="/admin/products" className="dashboard-inline-link">إدارة المنتجات <ExternalLink aria-hidden="true" /></Link><Link href="/merchant" className="dashboard-inline-link">عمليات التاجر <ExternalLink aria-hidden="true" /></Link></div></div>{orders.error ? <div className="dashboard-empty"><CircleAlert aria-hidden="true" /><h3>تعذر قراءة الطلبات</h3><p>تحققي من اتصال Supabase وسياسات دور admin.</p></div> : orderCount === 0 ? <div className="dashboard-empty"><BarChart3 aria-hidden="true" /><h3>لا توجد طلبات بعد</h3><p>سيظهر هذا التقرير تلقائياً بعد إنشاء طلبات حقيقية.</p></div> : <div className="city-summary">{Object.entries(cityCounts).map(([city, count]) => <div key={city}><strong>{count.toLocaleString("ar-EG")}</strong><span>{city}</span></div>)}</div>}</div></section></main>;
}
