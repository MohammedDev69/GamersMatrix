import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export default function TopUpsPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogPage titleKey="topUps" fixedKind="TOP_UP" />
    </Suspense>
  );
}
