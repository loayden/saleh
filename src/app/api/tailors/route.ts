import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tailors")
    .select("id,name_ar,city,district,verified,active,created_at")
    .eq("active", true)
    .eq("verified", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ data: [], meta: { live: false, count: 0 }, error: "تعذر تحميل قائمة الخيّاطات" }, { status: 503 });
  }

  return NextResponse.json({ data: data || [], meta: { live: true, count: data?.length || 0 } });
}
