import Link from "next/link";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Clock3 } from "lucide-react";
import AuthRequiredState from "@/components/auth-required-state";

export default async function OrdersPage() {
  await connection();
  const supabase = await createSupabaseServerClient(), { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/orders" />;
  const { data: orders } = await supabase.from("orders").select("id,status,subtotal_egp,created_at").order("created_at", { ascending: false });
  return <main dir="rtl" className="account-page"><Link href="/account">← العودة لحسابي</Link><p className="eyebrow">مساحتي / طلباتي</p><h1>طلباتي</h1>{orders?.length ? <div className="orders-list">{orders.map((order) => <Link className="order-list-link" href={`/orders/${order.id}`} key={order.id}><article><div><strong>طلب #{order.id.slice(0, 8)}</strong><small>{new Date(order.created_at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</small></div><span>{order.status}</span><b>{Number(order.subtotal_egp).toLocaleString("ar-EG")} ج.م</b><small className="order-list-arrow">عرض التفاصيل ←</small></article></Link>)}</div> : <div className="account-empty"><Clock3 aria-hidden="true" /><h2>لسه مفيش طلبات</h2><p>لما تكملي أول طلب هتلاقي تفاصيله هنا.</p><Link className="primary" href="/shop">ابدئي التسوق ←</Link></div>}</main>;
}
