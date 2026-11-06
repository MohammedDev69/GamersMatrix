"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { listProducts, type CatalogQuery } from "@/lib/catalog/repository";
import type { Product } from "@/lib/api";
import { cn } from "@/lib/cn";

type Props = {
  titleKey?: "shop" | "giftCards" | "topUps" | "offers" | "search" | "category";
  titleOverride?: string;
  fixedKind?: "GIFT_CARD" | "TOP_UP" | "GAME_KEY" | "SERVICE";
  fixedPlatform?: string;
  fixedCategory?: string;
  weeklyDealOnly?: boolean;
  showSearchHint?: boolean;
};

export function CatalogPage({
  titleKey = "shop",
  titleOverride,
  fixedKind,
  fixedPlatform,
  fixedCategory,
  weeklyDealOnly,
  showSearchHint,
}: Props) {
  const t = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState<string>("api");

  const filter = searchParams.get("filter") || "all";
  const sort = searchParams.get("sort") || "popular";
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const platform = searchParams.get("platform") || fixedPlatform || "";

  const baseQuery = useMemo((): CatalogQuery => {
    return {
      lang: locale,
      sort,
      kind: fixedKind,
      platform: platform || undefined,
      search: search || undefined,
      category: fixedCategory,
      weeklyDeal: weeklyDealOnly || undefined,
      hot: filter === "hot" || undefined,
      isNew: filter === "new" || undefined,
      pageSize: 20,
    };
  }, [
    locale,
    sort,
    fixedKind,
    platform,
    search,
    fixedCategory,
    weeklyDealOnly,
    filter,
  ]);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(false);
      }
      try {
        const result = await listProducts({ ...baseQuery, page: nextPage });
        setItems((prev) =>
          append ? [...prev, ...result.items] : result.items,
        );
        setHasMore(result.hasMore);
        setPage(nextPage);
        setSource(result.source);
      } catch {
        if (!append) {
          setError(true);
          setItems([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [baseQuery],
  );

  useEffect(() => {
    void load(1, false);
  }, [load]);

  const filters = [
    { id: "all", label: t("all") },
    { id: "hot", label: t("hot") },
    { id: "new", label: t("new") },
  ];

  function hrefFor(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  }

  const title =
    titleOverride ||
    (titleKey === "offers"
      ? t("offers")
      : titleKey === "search"
        ? t("searchResults")
        : titleKey === "category"
          ? t("shop")
          : t(titleKey));

  return (
    <StoreShell>
      <div className="gm-container py-8 md:py-10">
        <SectionHeading
          title={title}
          description={
            search
              ? t("searchFor", { query: search })
              : showSearchHint
                ? t("browseHint")
                : undefined
          }
          as="h1"
        />

        {source === "dev-fixtures" ? (
          <p className="mb-4 text-xs text-[var(--gm-warning)]" role="status">
            {t("fixtureNotice")}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active =
                filter === f.id || (f.id === "all" && filter === "all");
              return (
                <Link
                  key={f.id}
                  href={hrefFor({ filter: f.id === "all" ? "" : f.id })}
                  className={cn(
                    "rounded-[var(--gm-radius-btn)] px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--gm-violet-700)] text-white"
                      : "bg-[var(--gm-surface)] text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]",
                  )}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--gm-text-secondary)]">
            <span className="sr-only">{t("sortPopular")}</span>
            <select
              className="gm-input h-11 w-auto text-sm"
              value={sort}
              onChange={(e) => {
                window.location.search = hrefFor({ sort: e.target.value });
              }}
            >
              <option value="popular">{t("sortPopular")}</option>
              <option value="newest">{t("sortNewest")}</option>
              <option value="price_asc">{t("sortPriceAsc")}</option>
              <option value="price_desc">{t("sortPriceDesc")}</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-[var(--gm-radius-card)]" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8">
            <ErrorState
              title={tCommon("error")}
              description={t("loadError")}
              onRetry={() => void load(1, false)}
              retryLabel={tCommon("retry")}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={t("noProducts")}
              description={t("noProductsHint")}
              action={
                <Link href="/shop">
                  <Button variant="secondary">{tHome("viewAll")}</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            {hasMore ? (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  loading={loadingMore}
                  onClick={() => void load(page + 1, true)}
                >
                  {t("loadMore")}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </StoreShell>
  );
}
