"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/api";
import { listProducts, type CatalogQuery } from "@/lib/catalog/repository";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { CountdownTimer } from "./CountdownTimer";

type TitleKey = "featured" | "newReleases" | "offers" | "popular" | "steamGames" | "directTopUp";
type Props = { titleKey: TitleKey; query: CatalogQuery; viewAllHref: string; countdown?: boolean };

/* Vertical padding gives hover lift + outer glow room so shadows aren't clipped */
const rail =
  "gm-noscroll -mx-4 flex snap-x gap-4 overflow-x-auto px-4 py-3 md:mx-0 md:px-0";
const cell = "w-[172px] shrink-0 snap-start sm:w-[196px] lg:w-[212px]";

export function ProductSection({ titleKey, query, viewAllHref, countdown }: Props) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    setLoading(true);
    listProducts({ ...(JSON.parse(queryKey) as CatalogQuery), lang: locale, pageSize: 12, limit: 12 })
      .then((r) => setItems(r.items.slice(0, 12)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [queryKey, locale]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="gm-container py-7 md:py-9">
      <Reveal>
        <SectionHeading
          title={t(titleKey)}
          className="!mb-5"
          action={
            <div className="flex items-center gap-4">
              {countdown ? <CountdownTimer className="hidden sm:flex" /> : null}
              <Link
                href={viewAllHref}
                className="group rounded-full border border-[var(--gm-border-strong)] px-4 py-1.5 text-sm font-bold text-[var(--gm-violet-400)] transition-all hover:border-[var(--gm-violet-500)] hover:bg-[var(--gm-accent-dim)] hover:text-[var(--gm-violet-300)]"
              >
                {t("viewAll")}
              </Link>
            </div>
          }
        />
      </Reveal>
      <div className="relative">
        <div className={rail}>
          {loading
            ? Array.from({ length: 6 }).map((_, n) => <Skeleton key={n} className={`${cell} aspect-[3/4.4] rounded-[var(--gm-radius-card)]`} />)
            : items.map((p, n) => <ProductCard key={p.id} product={p} index={n} className={cell} />)}
        </div>
        {/* Soft edge fades hint that the rail scrolls */}
        <div className="pointer-events-none absolute inset-y-0 start-0 hidden w-10 bg-gradient-to-r from-[var(--gm-bg)] to-transparent rtl:bg-gradient-to-l md:block" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 end-0 hidden w-10 bg-gradient-to-l from-[var(--gm-bg)] to-transparent rtl:bg-gradient-to-r md:block" aria-hidden />
      </div>
    </section>
  );
}
