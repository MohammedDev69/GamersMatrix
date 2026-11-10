import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export default function ShopPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogPage titleKey="shop" />
    </Suspense>
  );
}
