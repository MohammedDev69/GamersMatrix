"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Product } from "@/lib/api";
import { ProductCard } from "@/components/products/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";

export function BestSellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>("/products/bestsellers?limit=10")
      .then((data) => setProducts(data.slice(0, 10)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !products.length) return null;

  return (
    <Reveal as="section" className="gm-stagger space-y-6">
      <div className="gm-reveal flex items-end justify-between gap-4">
        <div>
          <h2 className="gm-section-title">الأكثر مبيعاً</h2>
          <p className="mt-1 text-sm text-[var(--gm-muted)]">
            اختيارات العملاء الأكثر طلباً
          </p>
        </div>
        <Link
          href="/products?bestsellers=true"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--gm-muted)] transition hover:text-white"
        >
          عرض الكل
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-[3/4.4] rounded-[var(--gm-radius-card)]"
              />
            ))
          : products.slice(0, 10).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
      </div>
    </Reveal>
  );
}
