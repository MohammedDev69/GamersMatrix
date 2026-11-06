import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";

export default function OffersPage() {
  return (
    <Suspense fallback={null}>
      <CatalogPage titleKey="offers" weeklyDealOnly showSearchHint />
    </Suspense>
  );
}
