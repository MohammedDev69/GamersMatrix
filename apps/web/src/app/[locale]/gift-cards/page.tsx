import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export default function GiftCardsPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogPage titleKey="giftCards" fixedKind="GIFT_CARD" />
    </Suspense>
  );
}
