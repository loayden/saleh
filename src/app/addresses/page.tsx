import Link from "next/link";
import AddressBook from "@/components/address-book";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AuthRequiredState from "@/components/auth-required-state";

export default async function AddressesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthRequiredState next="/addresses" />;
  const { data: addresses } = await supabase.from("addresses").select("id,city,district,address_line,is_default").eq("user_id", user.id).order("created_at", { ascending: false });
  return <main dir="rtl" className="account-page"><Link href="/">← العودة للمتجر</Link><AddressBook initial={addresses || []} /></main>;
}
