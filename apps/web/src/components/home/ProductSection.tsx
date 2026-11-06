"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/api";
import { listProducts, type CatalogQuery } from "@/lib/catalog/repository";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { CountdownTimer } from "./CountdownTimer";

type TitleKey = "featured" | "newReleases" | "offers" | "popular" | "steamGames" | "directTopUp";
type Props = { titleKey: TitleKey; query: CatalogQuery; viewAllHref: string; countdown?: boolean };

const rail = "gm-noscroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0";
const cell = "w-[170px] shrink-0 snap-start sm:w-[190px] lg:w-[205px]";

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
    <section className="gm-container py-6 md:py-8">
      <SectionHeading
        title={t(titleKey)}
        className="!mb-4"
        action={
          <div className="flex items-center gap-4">
            {countdown ? <CountdownTimer className="hidden sm:flex" /> : null}
            <Link href={viewAllHref} className="rounded-[var(--gm-radius-btn)] border border-[var(--gm-border-strong)] px-3 py-1.5 text-sm font-bold text-[var(--gm-violet-300)] hover:bg-[var(--gm-accent-dim)]">{t("viewAll")}</Link>
          </div>
        }
      />
      <div className={rail}>
        {loading
          ? Array.from({ length: 6 }).map((_, n) => <Skeleton key={n} className={`${cell} aspect-[3/4.4] rounded-[var(--gm-radius-card)]`} />)
          : items.map((p, n) => <ProductCard key={p.id} product={p} index={n} className={cell} />)}
      </div>
    </section>
  );
}
