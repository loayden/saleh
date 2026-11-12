import Link from "next/link";
import { Boxes, ExternalLink, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import MerchantOperations from "@/components/merchant-operations";
import MerchantProductForm from "@/components/merchant-product-form";

type InventoryRow = { meters: number | string | null }[];
type ProductRow = { id: string; name_ar: string; slug: string; fabric_type: string; price_egp: number | string; active: boolean; verified: boolean; inventory: InventoryRow };

export default async function MerchantPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/merchant" />;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "merchant" && profile?.role !== "admin") return <AccessDenied />;

  const [{ data, error }, { data: orders }, { data: requests }] = await Promise.all([
    supabase.from("fabric_products").select("id,name_ar,slug,fabric_type,price_egp,active,verified,inventory(meters)").order("created_at", { ascending: false }),
    supabase.from("orders").select("id,status,city,subtotal_egp,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("tailoring_requests").select("id,status,customer_name,garment_type,city,tailoring_price_egp,created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const products = (data || []) as ProductRow[];
  const available = products.filter((product) => product.active && product.verified && Number(product.inventory?.[0]?.meters || 0) > 0);
  const totalMeters = available.reduce((sum, product) => sum + Number(product.inventory?.[0]?.meters || 0), 0);

  return <main dir="rtl" className="dashboard-shell"><header className="dashboard-header"><div><p className="eyebrow">صَالِح / عمليات التاجر</p><h1>لوحة التاجر</h1><small className="dashboard-subtitle">{user.email}</small></div><span className="live-badge"><ShieldCheck aria-hidden="true" /> بيانات مباشرة</span></header><div className="dashboard-layout"><aside className="dashboard-side"><Link className="active" href="#inventory"><Boxes aria-hidden="true" /> المخزون <span>←</span></Link><Link href="#orders">الطلبات <span>←</span></Link><Link href="#requests">طلبات التفصيل <span>←</span></Link><Link href="/"><ExternalLink aria-hidden="true" /> العودة للمتجر <span>↗</span></Link></aside><section className="dashboard-main"><div className="metric-grid"><div><small>منتجاتك المسجلة</small><strong>{products.length}</strong><span>من قاعدة البيانات</span></div><div><small>منتجات موثقة ومتاحة</small><strong>{available.length}</strong><span>يمكن للعميلة شراؤها</span></div><div><small>المخزون المتاح</small><strong>{totalMeters.toLocaleString("ar-EG")} م</strong><span>قراءة مباشرة</span></div><div><small>حالة البيانات</small><strong>{error ? "تعذر التحميل" : "متصلة"}</strong><span>{error ? "حاولي لاحقاً" : "Supabase"}</span></div></div><MerchantProductForm /><div className="dashboard-panel" id="inventory"><div className="panel-head"><div><p className="eyebrow">المخزون</p><h2>مخزون الأقمشة</h2></div></div>{error ? <div className="dashboard-empty"><p>تعذر قراءة مخزون التاجر من Supabase حالياً.</p></div> : products.length === 0 ? <div className="dashboard-empty"><Boxes aria-hidden="true" /><h3>لا توجد منتجات مسجلة</h3><p>أضيفي المنتج من أداة الإدخال المعتمدة قبل نشره للعميلات.</p></div> : <div className="dashboard-table-wrap"><table><thead><tr><th>القماش</th><th>النوع</th><th>السعر / متر</th><th>المتاح</th><th>الحالة</th></tr></thead><tbody>{products.map((product) => { const meters = Number(product.inventory?.[0]?.meters || 0); return <tr key={product.id}><td><strong>{product.name_ar}</strong><small className="table-slug">{product.slug}</small></td><td>{product.fabric_type}</td><td>{Number(product.price_egp).toLocaleString("ar-EG")} ج.م</td><td>{meters.toLocaleString("ar-EG")} م</td><td><span className={`stock-pill ${!product.active || !product.verified || meters <= 0 ? "low" : ""}`}>{!product.active ? "موقوف" : !product.verified ? "بانتظار التحقق" : meters > 0 ? "متاح" : "نفد"}</span></td></tr>; })}</tbody></table></div>}</div><MerchantOperations orders={orders || []} requests={requests || []} /></section></div></main>;
}

function AccessDenied() {
  return <main dir="rtl" className="dashboard-shell dashboard-access"><div className="dashboard-access-card"><ShieldCheck aria-hidden="true" /><p className="eyebrow">صَالِح / صلاحيات الحساب</p><h1>الوصول مقيّد</h1><p>هذه الشاشة متاحة للحسابات التي تم تعيين دور التاجر أو الإدارة لها من خلال Supabase.</p><Link className="primary" href="/account">العودة إلى حسابي</Link></div></main>;
}
