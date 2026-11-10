import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export default function OffersPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogPage titleKey="offers" weeklyDealOnly showSearchHint />
    </Suspense>
  );
}
