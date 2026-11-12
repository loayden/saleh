"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyDesignRoute() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const target = `/tailoring/${slug}`;
  useEffect(() => { router.replace(target); }, [router, target]);
  return <main dir="rtl" className="route-state" aria-busy="true"><h1>بننقلك لمساعد التفصيل...</h1><p>لو لم يتم النقل تلقائياً، افتحي الرابط التالي.</p><Link className="primary" href={target}>فتح مساعد التفصيل ←</Link></main>;
}
