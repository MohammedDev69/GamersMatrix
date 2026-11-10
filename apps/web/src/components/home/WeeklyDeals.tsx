"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type Product } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { getProductImageUrl } from "@/lib/product-image";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { CountdownTimer } from "./CountdownTimer";

function pickDeals(weekly: Product[], pool: Product[]) {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of [...weekly, ...pool.filter((x) => x.discountPct)]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= 5) break;
  }
  return out;
}

function shortPlatform(platform: string) {
  if (/playstation\s*5|ps5/i.test(platform)) return "PS5";
  if (/playstation|psn/i.test(platform)) return "PSN";
  if (/xbox/i.test(platform)) return "Xbox";
  if (/pc|steam/i.test(platform)) return "PC";
  return platform;
}

export function WeeklyDeals() {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    Promise.all([
      api.get<Product[]>("/products?weeklyDeal=true").catch(() => [] as Product[]),
      api.get<Product[]>("/products").catch(() => [] as Product[]),
    ])
      .then(([weekly, all]) => {
        setDeals(pickDeals(weekly, all));
      })
      .finally(() => setLoading(false));
  }, []);

  const end = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString();
  }, []);

  return (
    <Reveal as="section" className="gm-stagger space-y-5">
      <div className="gm-reveal flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="gm-section-title">عروض الأسبوع</h2>
          <p className="mt-1 text-sm text-[var(--gm-muted)]">
            خصومات لفترة محدودة
          </p>
        </div>
        <CountdownTimer endsAt={end} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-[var(--gm-radius-card)]" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <p className="gm-reveal text-sm text-[var(--gm-muted)]">لا توجد عروض حالياً</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {deals.map((deal, i) => {
            const imageUrl = getProductImageUrl(deal.imageUrl);
            return (
            <Link
              key={deal.id}
              href={`/products/${deal.slug}`}
              className="gm-reveal group space-y-2.5"
              style={{ transitionDelay: `${80 + i * 70}ms` }}
            >
              {imageUrl ? (
                <div className="gm-card-lift relative aspect-[16/10] overflow-hidden rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)]">
                <Image
                  src={imageUrl}
                  alt={deal.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.07] group-hover:brightness-110"
                  sizes="(max-width:640px) 50vw, 20vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                {deal.discountPct ? (
                  <span className="gm-animate-badge absolute start-2 top-2 rounded bg-[var(--gm-accent)] px-2 py-0.5 text-[11px] font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.4)]">
                    -{deal.discountPct}%
                  </span>
                ) : null}
                <span className="absolute bottom-2 end-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
                  {shortPlatform(deal.platform)}
                </span>
                </div>
              ) : null}
              <p className="line-clamp-1 text-sm font-medium text-white transition group-hover:text-[var(--gm-accent-bright)]">
                {deal.title}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-bold text-white">
                  {formatPrice(deal.priceEGP)}
                </span>
                {deal.originalPrice ? (
                  <span className="text-xs text-[var(--gm-muted)] line-through">
                    {formatPrice(deal.originalPrice)}
                  </span>
                ) : null}
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </Reveal>
  );
}
