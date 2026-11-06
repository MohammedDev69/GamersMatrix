"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { ProductCard } from "@/components/products/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, refresh } = useWishlist();
  const router = useRouter();
  const t = useTranslations("Wishlist");
  const tCatalog = useTranslations("Catalog");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  if (authLoading || !user) {
    return (
      <StoreShell>
        <div className="gm-container py-10">
          <Skeleton className="h-10 w-40" />
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <div className="gm-container py-8 md:py-10">
        <SectionHeading title={t("title")} as="h1" />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-[3/4] rounded-[var(--gm-radius-card)]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyHint")}
            action={
              <Link href="/shop">
                <Button variant="secondary">{tCatalog("shop")}</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {items.map((row, i) => (
              <ProductCard key={row.id} product={row.product} index={i} />
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
