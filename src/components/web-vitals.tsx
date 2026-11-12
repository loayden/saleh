"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/analytics";

export function WebVitals() {
  useReportWebVitals((metric) => {
    trackEvent("web_vital", { name: metric.name, value: Math.round(metric.value * 100) / 100, rating: metric.rating || "unknown" });
  });
  return null;
}
