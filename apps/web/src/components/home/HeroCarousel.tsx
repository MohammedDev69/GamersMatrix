"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Gift, Percent, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/api";
import { listProducts } from "@/lib/catalog/repository";
import { useCurrency } from "@/lib/currency";
import { getValidSale } from "@/lib/pricing";
import { getProductImageUrl } from "@/lib/product-image";
import { cn } from "@/lib/cn";

export function HeroCarousel() {
  const ar = useLocale() === "ar";
  const locale = useLocale();
  const { formatPrice } = useCurrency();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [i, setI] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setLoading(true);
    listProducts({ lang: locale, featured: true, sort: "popular", pageSize: 5, limit: 5 })
      .then((r) => setItems(r.items.slice(0, 5)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locale]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = setInterval(() => {
      setDirection(1);
      setI((n) => (n + 1) % items.length);
    }, 6000);
    return () => clearInterval(id);
  }, [items.length, paused, i]);

  const cur = items[i];
  const sale = cur ? getValidSale(cur) : null;
  const imageUrl = cur ? getProductImageUrl(cur.imageUrl) : null;
  const Prev = ar ? ChevronRight : ChevronLeft;
  const Next = ar ? ChevronLeft : ChevronRight;
  const go = (d: number) => {
    setDirection(d);
    setI((n) => (n + d + items.length) % items.length);
  };

  const tiles = [
    { href: "/offers", icon: Percent, title: ar ? "عروض الأسبوع" : "Weekly deals", sub: ar ? "خصومات تصل إلى 50%" : "Up to 50% off", tone: "bg-[var(--gm-deal)] text-[var(--gm-on-deal)]" },
    { href: "/gift-cards", icon: Gift, title: ar ? "بطاقات الهدايا" : "Gift cards", sub: ar ? "Steam وPlayStation وغيرها" : "Steam, PlayStation and more", tone: "bg-[var(--gm-violet-700)] text-white" },
  ];

  return (
    <div className="gm-container grid gap-4 pt-5 lg:grid-cols-[1fr_300px] lg:pt-6">
      <section
        className="relative min-h-[320px] overflow-hidden rounded-[var(--gm-radius-hero)] border border-[var(--gm-border)] bg-[var(--gm-surface)] md:min-h-[400px]"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
          <motion.div key="loading" className="gm-skeleton absolute inset-0 rounded-none" />
          ) : cur && sale ? (
          <motion.div
            key={cur.id}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, x: direction * (ar ? -22 : 22) }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: direction * (ar ? 14 : -14) }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt="" fill priority sizes="1200px" className="scale-110 object-cover opacity-35 blur-3xl" />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_80%_10%,rgba(139,61,255,0.16),transparent_60%)]" aria-hidden />

            {/* Readability scrim: solid at the text side, clear at the artwork */}
            <div
              className={cn(
                "absolute inset-0",
                imageUrl
                  ? cn(ar ? "bg-gradient-to-l" : "bg-gradient-to-r", "from-[#0a0614] via-[#0d0819]/90 via-45% to-transparent")
                  : "bg-[linear-gradient(135deg,#0a0614_0%,#10091d_58%,#180c2b_100%)]",
              )}
              aria-hidden
            />

            <div className={cn("relative grid h-full items-center gap-8 p-6 md:p-12", imageUrl && "md:grid-cols-[1fr_minmax(220px,250px)]")}>
              <div className="max-w-xl space-y-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gm-accent-dim)] px-3 py-1 text-xs font-bold text-[var(--gm-violet-300)] ring-1 ring-inset ring-[rgba(173,120,255,0.3)]">
                  <Zap className="h-3 w-3" aria-hidden />
                  <span dir="ltr">{cur.platform}</span>
                </span>

                <h1 className="text-balance text-3xl font-black leading-[1.2] tracking-tight md:text-5xl" dir="auto">
                  {cur.title}
                </h1>

                <p className="line-clamp-2 max-w-md text-sm leading-7 text-[var(--gm-text-secondary)]" dir="auto">{cur.description}</p>

                <div className="flex flex-wrap items-center gap-3 pb-1" dir={ar ? "rtl" : "ltr"}>
                  <span className="gm-num text-3xl font-black tracking-tight md:text-4xl">{formatPrice(sale.current)}</span>
                  {sale.compareAt ? <span className="gm-num text-sm text-[var(--gm-text-muted)] line-through">{formatPrice(sale.compareAt)}</span> : null}
                  {sale.discountPct ? (
                    <span className="gm-num rounded-full bg-[var(--gm-deal)] px-2.5 py-1 text-xs font-extrabold text-[var(--gm-on-deal)] shadow-[0_2px_10px_rgba(245,185,66,0.35)]">-{sale.discountPct}%</span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3" dir={ar ? "rtl" : "ltr"}>
                  <Link href={`/products/${cur.slug}`} className="gm-btn gm-btn-primary !rounded-full !px-8">
                    {ar ? "اشترِ الآن" : "Buy now"}
                  </Link>
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--gm-success)]">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                    {ar ? "تسليم فوري" : "Instant delivery"}
                  </span>
                </div>
              </div>

              {imageUrl ? (
                <Link
                  href={`/products/${cur.slug}`}
                  tabIndex={-1}
                  aria-hidden
                  className="relative mx-auto hidden aspect-[3/4] w-full overflow-hidden rounded-[var(--gm-radius-hero)] border border-[rgba(173,120,255,0.35)] shadow-[var(--gm-shadow-2),var(--gm-shadow-glow)] md:block"
                >
                  <Image src={imageUrl} alt="" fill sizes="250px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />
                </Link>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-[var(--gm-muted)]"
          >
            {ar ? "لا توجد عروض مميزة حالياً" : "No featured deals right now"}
          </motion.div>
        )}
        </AnimatePresence>

        {items.length > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={ar ? "السابق" : "Previous"} className="absolute start-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(6,3,12,0.55)] backdrop-blur transition hover:bg-[rgba(6,3,12,0.8)] md:flex"><Prev className="h-5 w-5" /></button>
            <button type="button" onClick={() => go(1)} aria-label={ar ? "التالي" : "Next"} className="absolute end-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(6,3,12,0.55)] backdrop-blur transition hover:bg-[rgba(6,3,12,0.8)] md:flex"><Next className="h-5 w-5" /></button>
            <div className="absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5">
              {items.map((p, n) => (
                <button key={p.id} type="button" onClick={() => { setDirection(n >= i ? 1 : -1); setI(n); }} aria-label={p.title} aria-current={n === i} className={cn("h-1.5 rounded-full transition-all duration-300", n === i ? "w-7 bg-gradient-to-r from-[var(--gm-violet-500)] to-[var(--gm-violet-700)]" : "w-1.5 bg-white/25 hover:bg-white/40")} />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <div className="hidden gap-4 lg:grid lg:grid-rows-2">
        {tiles.map(({ href, icon: Icon, title, sub, tone }) => (
          <Link
            key={href}
            href={href}
            className="gm-card-lift group flex items-center gap-4 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5"
          >
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--gm-radius-btn)] transition-transform group-hover:scale-105", tone)}><Icon className="h-6 w-6" aria-hidden /></span>
            <span>
              <span className="block text-base font-extrabold">{title}</span>
              <span className="text-sm text-[var(--gm-text-muted)]">{sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
