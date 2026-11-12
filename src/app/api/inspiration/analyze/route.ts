import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { openAIResponses, OpenAIRequestError, parseOpenAIJson } from "@/lib/openai-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { imageData?: string } | null;
  if (typeof body?.imageData !== "string" || !body.imageData.startsWith("data:image/")) return NextResponse.json({ error: "صورة الإلهام غير صالحة" }, { status: 400 });
  if (body.imageData.length > 12_000_000) return NextResponse.json({ error: "الصورة أكبر من الحد المسموح" }, { status: 413 });
  const supabase = await createSupabaseServerClient();
  const { data: products, error } = await supabase.from("fabric_products").select("id,slug,name_ar,fabric_type,price_egp,feel,note,colors,inventory(meters)").eq("active", true).eq("verified", true).limit(100);
  if (error) return NextResponse.json({ error: "تعذر قراءة المنتجات الموثقة للتحليل" }, { status: 503 });
  const candidates = (products || []).map((product) => { const inventory = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory; return { id: product.id, slug: product.slug, name: product.name_ar, type: product.fabric_type, feel: product.feel, note: product.note, colors: product.colors, stock: Number(inventory?.meters || 0), price: Number(product.price_egp) }; }).filter((product) => product.stock > 0);
  if (!candidates.length) return NextResponse.json({ error: "لا توجد منتجات موثقة ومتاحة لمطابقة الصورة حالياً" }, { status: 409 });
  try {
    const result = await openAIResponses({ model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini", input: [{ role: "system", content: "أنتِ خبيرة أقمشة وأزياء. حللي صورة الإلهام بحذر، ولا تدّعي معرفة نوع القماش الأصلي يقيناً. اختاري فقط من قائمة المنتجات الموثقة المتاحة. اكتبي بالعربية المصرية الواضحة." }, { role: "user", content: [{ type: "input_text", text: `حللي الصورة، ثم قارنيها بمنتجات المخزون التالية. أعيدي خصائص التصميم، درجة عدم اليقين، ومعرّفات المنتجات المناسبة فقط. المنتجات: ${JSON.stringify(candidates)}` }, { type: "input_image", image_url: body.imageData, detail: "auto" }] }], text: { format: { type: "json_schema", name: "fabric_inspiration_analysis", strict: true, schema: { type: "object", additionalProperties: false, properties: { garment_category: { type: "string" }, style_summary: { type: "string" }, possible_fabric_characteristics: { type: "array", items: { type: "string" } }, suggested_colors: { type: "array", items: { type: "string" } }, confidence: { type: "string", enum: ["low", "medium", "high"] }, caveats: { type: "array", items: { type: "string" } }, candidate_product_ids: { type: "array", items: { type: "string" } } }, required: ["garment_category", "style_summary", "possible_fabric_characteristics", "suggested_colors", "confidence", "caveats", "candidate_product_ids"] } } }, max_output_tokens: 900 });
    const analysis = parseOpenAIJson(result.output_text);
    const candidateIds = Array.isArray(analysis.candidate_product_ids) ? analysis.candidate_product_ids.filter((id): id is string => typeof id === "string" && candidates.some((product) => product.id === id)) : [];
    const safeAnalysis = { ...analysis, candidate_product_ids: candidateIds };
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("ai_sessions").insert({ user_id: user?.id || null, input: { type: "inspiration_analysis", candidate_count: candidates.length }, output: safeAnalysis, model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini" });
    return NextResponse.json({ configured: true, data: { analysis: safeAnalysis, matches: candidates.filter((product) => candidateIds.includes(product.id)) } });
  } catch (caught) {
    const error = caught instanceof OpenAIRequestError ? caught : new OpenAIRequestError("تعذر إتمام تحليل الصورة.", 502);
    return NextResponse.json({ error: error.message, configured: error.status !== 501 }, { status: error.status });
  }
}
