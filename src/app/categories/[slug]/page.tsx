"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const categories = {
  evening: { title: "للسهرة", intro: "مساحة إلهام للقطع التي تحتاج حضوراً وملمساً واضحاً.", image: "/images/editorial-evening.jpg" },
  everyday: { title: "لليوم العادي", intro: "خامات وأفكار تساعدك تبني خزانة مريحة وتعيش معاكِ.", image: "/images/editorial-everyday.jpg" },
  wardrobe: { title: "خزانة هادئة", intro: "اختيارات بسيطة للتنسيق اليومي والقطع التي ترجعين لها كثيراً.", image: "/images/editorial-wardrobe.jpg" },
};

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories[slug as keyof typeof categories];
  if (!category) return <main dir="rtl" className="route-state"><h1>القسم غير موجود</h1><Link className="primary" href="/categories">كل الأقسام ←</Link></main>;
  return <main dir="rtl" className="category-landing"><Link href="/categories" className="category-landing-back">← كل الأقسام</Link><section className="category-landing-hero"><div><p className="eyebrow">اكتشفي حسب النوع</p><h1>{category.title}</h1><p>{category.intro}</p><Link className="primary" href="/shop">شوفي الأقمشة المتاحة ←</Link></div><img src={category.image} alt="" /></section><section className="category-landing-note"><p className="eyebrow">مهم تعرفي</p><h2>المنتجات الحقيقية تظهر من مخزون التاجر.</h2><p>هذه الصفحة تقدم اتجاه المجموعة فقط. السعر والكمية والصور لا تظهر إلا بعد إضافة منتج موثق إلى كتالوج صَالِح.</p><Link className="text-button" href="/tailors">ابدئي تصميم قطعة ←</Link></section></main>;
}
