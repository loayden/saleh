import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { openAIResponses, OpenAIRequestError } from "@/lib/openai-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { message?: string } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1200) return NextResponse.json({ error: "اكتبي سؤالك في 1200 حرف أو أقل" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase.from("fabric_products").select("id,name_ar,fabric_type,price_egp,feel,note,colors,inventory(meters)").eq("active", true).eq("verified", true).limit(100);
  const inventory = (products || []).map((product) => { const stockRow = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory; return { id: product.id, name: product.name_ar, type: product.fabric_type, price: Number(product.price_egp), feel: product.feel, note: product.note, colors: product.colors, stock: Number(stockRow?.meters || 0) }; }).filter((product) => product.stock > 0);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders } = user ? await supabase.from("orders").select("id,status,created_at,subtotal_egp").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5) : { data: [] };
  try {
    const result = await openAIResponses({ model: process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini", input: [{ role: "system", content: "أنتِ مساعد صَالِح للأقمشة والأزياء باللهجة المصرية المهذبة. لا تخترعي سعرًا أو مخزونًا أو موعد توصيل أو سياسة. استخدمي فقط البيانات المرفقة. إذا لم توجد معلومة قولي إنها غير متاحة ووجهي العميلة لطلب مراجعة من الفريق." }, { role: "user", content: `بيانات المنتجات المتاحة: ${JSON.stringify(inventory)}\nطلبات العميلة المسجلة: ${JSON.stringify(orders || [])}\nالسؤال: ${message}` }], max_output_tokens: 500 });
    return NextResponse.json({ configured: true, answer: result.output_text || "لم تصل إجابة قابلة للعرض." });
  } catch (caught) {
    const error = caught instanceof OpenAIRequestError ? caught : new OpenAIRequestError("تعذر تشغيل المساعد.", 502);
    return NextResponse.json({ configured: error.status !== 501, error: error.message }, { status: error.status });
  }
}
