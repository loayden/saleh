import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import MobileGlobalNav from "@/components/mobile-global-nav";
import { WebVitals } from "@/components/web-vitals";
export const metadata: Metadata = { title: "صَالِح — ابدئي تصميمك من القماش", description: "منصة اكتشاف وشراء الأقمشة وتصميم القطع التي تشبهك.", metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), alternates: { canonical: "/" }, openGraph: { title: "صَالِح — ابدئي تصميمك من القماش", description: "اكتشفي القماش المناسب لتصميمك.", locale: "ar_EG", type: "website" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f7f4ef" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl" data-scroll-behavior="smooth"><body><WebVitals />{children}<Suspense fallback={null}><MobileGlobalNav /></Suspense></body></html>; }
