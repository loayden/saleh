import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";
import MerchantProductForm from "@/components/merchant-product-form";
import AdminProductManager from "@/components/admin-product-manager";

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/admin/products" />;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <main dir="rtl" className="dashboard-shell dashboard-access"><div className="dashboard-access-card"><ShieldCheck aria-hidden="true" /><p className="eyebrow">صَالِح / صلاحيات الإدارة</p><h1>الوصول مقيّد</h1><p>إدارة المنتجات والتوثيق متاحة للإدارة فقط.</p><Link className="primary" href="/account">العودة إلى حسابي</Link></div></main>;
  const { data } = await supabase.from("fabric_products").select("id,name_ar,slug,fabric_type,price_egp,width_cm,colors,note,feel,image_url,active,verified,inventory(meters)").order("created_at", { ascending: false });
  return <main dir="rtl" className="dashboard-shell"><header className="dashboard-header"><div><Link href="/admin" className="dashboard-inline-link">← لوحة الإدارة</Link><p className="eyebrow">صَالِح / الإدارة</p><h1>المنتجات</h1><small className="dashboard-subtitle">{user.email}</small></div><span className="live-badge"><ShieldCheck aria-hidden="true" /> بيانات مباشرة</span></header><section className="admin-products-content"><MerchantProductForm /><AdminProductManager initial={(data || []) as never} /></section></main>;
}
