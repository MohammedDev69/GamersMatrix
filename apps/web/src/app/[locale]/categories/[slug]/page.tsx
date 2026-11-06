"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { StoreShell } from "@/components/layout/StoreShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { getCategoryBySlug } from "@/lib/catalog/repository";
import type { Category } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const t = useTranslations("Catalog");
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCategoryBySlug(slug, locale)
      .then((res) => {
        if (!res.category) setMissing(true);
        else setCategory(res.category);
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [slug, locale]);

  if (loading) {
    return (
      <StoreShell>
        <div className="gm-container py-10">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-6 h-64 w-full rounded-[var(--gm-radius-card)]" />
        </div>
      </StoreShell>
    );
  }

  if (missing || !category) {
    return (
      <StoreShell>
        <div className="gm-container py-10">
          <EmptyState
            title={t("categoryNotFound")}
            description={t("noProductsHint")}
            action={
              <Link href="/shop">
                <Button variant="secondary">{t("shop")}</Button>
              </Link>
            }
          />
        </div>
      </StoreShell>
    );
  }

  return (
    <CatalogPage
      titleKey="category"
      titleOverride={category.name}
      fixedCategory={category.slug}
      showSearchHint
    />
  );
}
