"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, ShoppingBag, UserRound } from "lucide-react";

export default function MobileGlobalNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const isActive = (paths: string[]) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return <nav className="mobile-global-nav" aria-label="التنقل الرئيسي على الهاتف">
    <Link className={isActive(["/"]) ? "active" : ""} href="/"><Home aria-hidden="true" /><small>الرئيسية</small></Link>
    <Link className={isActive(["/categories", "/fabrics"]) ? "active" : ""} href="/categories"><Compass aria-hidden="true" /><small>اكتشفي</small></Link>
    <Link className={isActive(["/cart"]) ? "active" : ""} href="/cart"><ShoppingBag aria-hidden="true" /><small>السلة</small></Link>
    <Link className={isActive(["/favorites"]) ? "active" : ""} href="/favorites"><Heart aria-hidden="true" /><small>المفضلة</small></Link>
    <Link className={isActive(["/account", "/auth", "/orders", "/addresses"]) ? "active" : ""} href="/account"><UserRound aria-hidden="true" /><small>حسابي</small></Link>
  </nav>;
}
