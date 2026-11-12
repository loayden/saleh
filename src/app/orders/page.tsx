import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Clock3 } from "lucide-react";
import AuthRequiredState from "@/components/auth-required-state";

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient(), { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/orders" />;
  const { data: orders } = await supabase.from("orders").select("id,status,subtotal_egp,created_at").order("created_at", { ascending: false });
  return <main dir="rtl" className="account-page"><Link href="/">← العودة للمتجر</Link><p className="eyebrow">مساحتي / طلباتي</p><h1>طلباتي</h1>{orders?.length ? <div className="orders-list">{orders.map((order) => <article key={order.id}><div><strong>طلب #{order.id.slice(0, 8)}</strong><small>{new Date(order.created_at).toLocaleDateString("ar-EG")}</small></div><span>{order.status}</span><b>{order.subtotal_egp} ج.م</b></article>)}</div> : <div className="account-empty"><Clock3 aria-hidden="true" /><h2>لسه مفيش طلبات</h2><p>لما تكملي أول طلب هتلاقي تفاصيله هنا.</p><Link className="primary" href="/">ابدئي التسوق ←</Link></div>}</main>;
}
