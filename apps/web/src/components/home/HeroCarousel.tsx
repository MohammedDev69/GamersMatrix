"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Gift, Percent } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/api";
import { listProducts } from "@/lib/catalog/repository";
import { useCurrency } from "@/lib/currency";
import { getValidSale } from "@/lib/pricing";
import { cn } from "@/lib/cn";

export function HeroCarousel() {
  const ar = useLocale() === "ar";
  const locale = useLocale();
  const { formatPrice } = useCurrency();
  const [items, setItems] = useState<Product[]>([]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    listProducts({ lang: locale, featured: true, sort: "popular", pageSize: 5, limit: 5 })
      .then((r) => setItems(r.items.slice(0, 5)))
      .catch(() => setItems([]));
  }, [locale]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [items.length, paused, i]);

  const cur = items[i];
  const sale = cur ? getValidSale(cur) : null;
  const Prev = ar ? ChevronRight : ChevronLeft;
  const Next = ar ? ChevronLeft : ChevronRight;
  const go = (d: number) => setI((n) => (n + d + items.length) % items.length);

  const tiles = [
    { href: "/offers", icon: Percent, title: ar ? "عروض الأسبوع" : "Weekly deals", sub: ar ? "خصومات تصل إلى 50%" : "Up to 50% off", tone: "bg-[var(--gm-deal)] text-[var(--gm-on-deal)]" },
    { href: "/gift-cards", icon: Gift, title: ar ? "بطاقات الهدايا" : "Gift cards", sub: ar ? "Steam وPlayStation وغيرها" : "Steam, PlayStation and more", tone: "bg-[var(--gm-violet-700)] text-white" },
  ];

  return (
    <div className="gm-container grid gap-3 pt-4 lg:grid-cols-[1fr_300px]">
      <section
        className="relative min-h-[280px] overflow-hidden rounded-[var(--gm-radius-hero)] border border-[var(--gm-border)] bg-[var(--gm-surface)] md:min-h-[360px]"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
      >
        {cur && sale ? (
          <div key={cur.id} className="gm-animate-fade-in absolute inset-0">
            <Image src={cur.imageUrl} alt="" fill priority sizes="900px" className="scale-110 object-cover opacity-30 blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--gm-bg)] via-[var(--gm-bg)]/70 to-transparent rtl:bg-gradient-to-l" />
            <div className="relative grid h-full items-center gap-6 p-6 md:grid-cols-[1fr_220px] md:p-10">
              <div className="space-y-4">
                <span dir="ltr" className="inline-block rounded-[var(--gm-radius-sm)] bg-white/10 px-2.5 py-1 text-xs font-bold">{cur.platform}</span>
                <h1 className="max-w-lg text-3xl font-extrabold leading-tight md:text-5xl"><span dir="auto">{cur.title}</span></h1>
                <p className="line-clamp-2 max-w-md text-sm leading-7 text-[var(--gm-text-secondary)]">{cur.description}</p>
                <div className="flex flex-wrap items-center gap-3" dir={ar ? "rtl" : "ltr"}>
                  <span className="gm-num text-3xl font-extrabold">{formatPrice(sale.current)}</span>
                  {sale.compareAt ? <span className="gm-num text-[var(--gm-text-muted)] line-through">{formatPrice(sale.compareAt)}</span> : null}
                  {sale.discountPct ? <span className="gm-num rounded-[var(--gm-radius-sm)] bg-[var(--gm-deal)] px-2 py-0.5 text-sm font-extrabold text-[var(--gm-on-deal)]">-{sale.discountPct}%</span> : null}
                </div>
                <Link href={`/products/${cur.slug}`} className="gm-btn gm-btn-primary !px-8">{ar ? "اشتري الآن" : "Buy now"}</Link>
              </div>
              <Link href={`/products/${cur.slug}`} className="relative mx-auto hidden aspect-[3/4] w-full overflow-hidden rounded-[var(--gm-radius-card)] border border-white/15 shadow-2xl md:block" tabIndex={-1} aria-hidden>
                <Image src={cur.imageUrl} alt="" fill sizes="220px" className="object-cover" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="gm-skeleton absolute inset-0 rounded-none" />
        )}

        {items.length > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={ar ? "السابق" : "Previous"} className="absolute start-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 md:flex"><Prev className="h-5 w-5" /></button>
            <button type="button" onClick={() => go(1)} aria-label={ar ? "التالي" : "Next"} className="absolute end-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 md:flex"><Next className="h-5 w-5" /></button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {items.map((p, n) => (
                <button key={p.id} type="button" onClick={() => setI(n)} aria-label={p.title} aria-current={n === i} className={cn("h-1.5 rounded-full transition-all", n === i ? "w-6 bg-[var(--gm-violet-500)]" : "w-1.5 bg-white/40")} />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <div className="hidden gap-3 lg:grid lg:grid-rows-2">
        {tiles.map(({ href, icon: Icon, title, sub, tone }) => (
          <Link key={href} href={href} className="gm-card gm-card-lift flex items-center gap-4 p-5">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--gm-radius-btn)]", tone)}><Icon className="h-6 w-6" aria-hidden /></span>
            <span><span className="block text-base font-extrabold">{title}</span><span className="text-sm text-[var(--gm-text-muted)]">{sub}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
