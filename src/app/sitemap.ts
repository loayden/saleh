import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const routes = ["/", "/shop", "/fabrics", "/cart", "/categories", "/categories/evening", "/categories/everyday", "/categories/wardrobe", "/guide", "/tailors", "/visualizer", "/assistant", "/auth", "/auth/signup", "/privacy", "/terms"];
  return routes.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly", priority: path === "/" ? 1 : 0.6 }));
}
