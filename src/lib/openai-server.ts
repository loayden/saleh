type OpenAIErrorPayload = { error?: { message?: string } };

export class OpenAIRequestError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "OpenAIRequestError";
    this.status = status;
  }
}

export async function openAIResponses(body: Record<string, unknown>) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new OpenAIRequestError("خدمة الذكاء الاصطناعي غير مفعّلة على الخادم.", 501);
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as OpenAIErrorPayload & { output_text?: string };
  if (!response.ok) throw new OpenAIRequestError(payload.error?.message || "تعذر الاتصال بخدمة الذكاء الاصطناعي.", response.status >= 400 && response.status < 500 ? 502 : 503);
  return payload;
}

export function parseOpenAIJson(text: string | undefined) {
  if (!text) throw new OpenAIRequestError("لم ترجع خدمة الذكاء الاصطناعي نتيجة قابلة للقراءة.", 502);
  try { return JSON.parse(text) as Record<string, unknown>; } catch { throw new OpenAIRequestError("نتيجة الذكاء الاصطناعي لم تكن بصيغة منظمة.", 502); }
}
