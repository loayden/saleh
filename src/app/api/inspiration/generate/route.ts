import { NextResponse } from "next/server";
import { OpenAIRequestError } from "@/lib/openai-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { imageData?: string; fabric?: { name?: string; type?: string; color?: string; feel?: string }; modification?: string } | null;
  if (typeof body?.imageData !== "string" || !body.imageData.startsWith("data:image/")) return NextResponse.json({ error: "صورة الإلهام غير صالحة" }, { status: 400 });
  if (body.imageData.length > 12_000_000) return NextResponse.json({ error: "الصورة أكبر من الحد المسموح" }, { status: 413 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ configured: false, message: "إنشاء المعاينة يحتاج إعداد OPENAI_API_KEY على الخادم." }, { status: 501 });
  const fabric = body.fabric || {};
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2", size: "1024x1024", prompt: `Create an approximate fashion concept, not a product photograph and not a tailoring guarantee. Use the silhouette and garment idea from the reference image, with fabric ${fabric.name || "selected fabric"}, material type ${fabric.type || "unknown"}, color ${fabric.color || "unspecified"}, feel ${fabric.feel || "unspecified"}, and modification ${body.modification || "none"}. Preserve a clear concept label in the application, avoid identifiable people, and do not claim the result matches the physical fabric exactly.` }) });
    const payload = await response.json().catch(() => ({})) as { data?: { b64_json?: string; url?: string }[]; error?: { message?: string } };
    if (!response.ok || !payload.data?.[0]) throw new OpenAIRequestError(payload.error?.message || "لم تُرجع خدمة الصور معاينة.", response.status >= 400 && response.status < 500 ? 502 : 503);
    const image = payload.data[0];
    return NextResponse.json({ configured: true, label: "معاينة مولدة بالذكاء الاصطناعي — فكرة تقريبية وليست نتيجة تفصيل مضمونة", imageData: image.b64_json ? `data:image/png;base64,${image.b64_json}` : null, imageUrl: image.url || null });
  } catch (caught) {
    const error = caught instanceof OpenAIRequestError ? caught : new OpenAIRequestError("تعذر إنشاء المعاينة.", 502);
    return NextResponse.json({ error: error.message, configured: true }, { status: error.status });
  }
}
