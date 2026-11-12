import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "صَالِح — ابدئي تصميمك من القماش", short_name: "صَالِح", description: "اكتشفي القماش المناسب لتصميمك.", start_url: "/", display: "standalone", background_color: "#f7f4ef", theme_color: "#302d2b", dir: "rtl", lang: "ar" };
}
