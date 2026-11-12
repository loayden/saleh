export const analyticsEvents = ["product_view", "search", "recommendation_view", "add_to_cart", "checkout_start", "order_completed", "web_vital"] as const;
export type AnalyticsEvent = typeof analyticsEvents[number];

export function trackEvent(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("nusj:analytics", { detail: { event, properties } }));
  void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event, properties }) }).catch(() => undefined);
}
