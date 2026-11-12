"use client";

import { useState } from "react";
import { CheckCircle2, LogOut, Upload, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = { full_name: string | null; phone: string | null; avatar_url: string | null; createdLabel: string };

export default function ProfileSettings({ initial, email }: { initial: Profile; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial.full_name || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [avatar, setAvatar] = useState(initial.avatar_url || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return setMessage("إعداد Supabase غير مكتمل");
    setSaving(true); setMessage("");
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim() || null, avatar_url: avatar || null }).eq("id", (await supabase.auth.getUser()).data.user?.id || ""),
      supabase.auth.updateUser({ data: { full_name: name.trim() } }),
    ]);
    setSaving(false);
    setMessage(profileError || authError ? "تعذر حفظ الملف الشخصي" : "تم حفظ بياناتك بنجاح");
    if (!profileError && !authError) router.refresh();
  };

  const upload = async (file: File | undefined) => {
    if (!file || !supabase) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) return setMessage("اختاري صورة أقل من 3MB");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("انتهت الجلسة، سجّلي الدخول مرة أخرى");
    setUploading(true); setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const result = await supabase.storage.from("profile-avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (result.error) { setUploading(false); return setMessage("تعذر رفع الصورة"); }
    const publicUrl = supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
    setAvatar(publicUrl); setUploading(false); setMessage("تم رفع الصورة، اضغطي حفظ الملف الشخصي");
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push("/"); router.refresh();
  };

  return <section className="profile-settings"><div className="profile-settings-head"><div className="profile-avatar">{avatar ? <img src={avatar} alt="صورتك الشخصية" /> : <UserRound aria-hidden="true" />}</div><div><p className="eyebrow">ملفي الشخصي</p><h2>بياناتك محفوظة مع حسابك</h2><p>{email}</p></div></div><form onSubmit={save}><label>الاسم الكامل<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label><label>رقم الموبايل<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" /></label><label className="profile-upload">الصورة الشخصية<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void upload(event.target.files?.[0])} /><span><Upload aria-hidden="true" /> {uploading ? "جاري رفع الصورة..." : "اختاري صورة من جهازك"}</span></label>{message && <p className="form-success-inline"><CheckCircle2 aria-hidden="true" /> {message}</p>}<button className="primary" disabled={saving || uploading} type="submit">{saving ? "جاري الحفظ..." : "حفظ الملف الشخصي"}</button></form><div className="profile-security"><div><strong>الأمان</strong><small>تغيير كلمة المرور أو استعادتها من صفحة الأمان.</small></div><a href="/auth/forgot-password">تغيير كلمة المرور ←</a></div><button className="profile-signout" type="button" onClick={() => void signOut()}><LogOut aria-hidden="true" /> تسجيل الخروج</button>{initial.createdLabel && <small className="profile-created">عضوة منذ {initial.createdLabel}</small>}</section>;
}
