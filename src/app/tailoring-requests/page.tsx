import Link from "next/link";
import { connection } from "next/server";
import { Scissors } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";

const labels: Record<string, string> = { new: "جديد", reviewing: "قيد المراجعة", quoted: "تم التسعير", accepted: "مقبول", in_progress: "قيد التنفيذ", completed: "مكتمل", cancelled: "ملغي" };

export default async function TailoringRequestsPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/tailoring-requests" />;
  const { data } = await supabase.from("tailoring_requests").select("id,status,customer_name,city,district,height_cm,fabric_color,requested_meters,garment_type,details,tailoring_price_egp,created_at,updated_at,tailors(name_ar)").eq("user_id", user.id).order("created_at", { ascending: false });
  return <main dir="rtl" className="account-page account-subpage"><Link href="/account">← العودة لحسابي</Link><p className="eyebrow">مساحتي / التفصيل</p><h1>طلبات التفصيل</h1><p className="account-subtitle">تابعي طلبات التصميم التي أرسلتيها لفريق صَالِح وتفاصيل التسعير والمراجعة.</p>{data?.length ? <div className="tailoring-request-list">{data.map((request) => <article key={request.id}><div className="tailoring-request-head"><span className="tailoring-request-icon"><Scissors aria-hidden="true" /></span><div><strong>{request.garment_type || "قطعة مخصصة"}</strong><small>{new Date(request.created_at).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</small></div><b className={`request-status ${request.status}`}>{labels[request.status] || request.status}</b></div><div className="tailoring-request-details"><span><b>القماش</b>{request.fabric_color || "لم يحدد"} · {request.requested_meters || "—"} متر</span><span><b>الطول</b>{request.height_cm ? `${request.height_cm} سم` : "—"}</span><span><b>العنوان</b>{request.city || "—"}، {request.district || "—"}</span>{request.tailoring_price_egp != null && <span><b>سعر التفصيل بعد المراجعة</b>{Number(request.tailoring_price_egp).toLocaleString("ar-EG")} ج.م</span>}</div><p>{request.details}</p></article>)}</div> : <div className="account-empty"><Scissors aria-hidden="true" /><h2>لسه مفيش طلبات تفصيل</h2><p>اختاري قماش من الكتالوج وابدئي تصميم قطعة تشبهك.</p><Link className="primary" href="/shop">اكتشفي الأقمشة ←</Link></div>}</main>;
}
