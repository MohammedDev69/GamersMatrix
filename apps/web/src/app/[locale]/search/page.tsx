import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export default function SearchPage() {
  return (
    <Suspense fallback={<CatalogSkeleton withHint />}>
      <CatalogPage titleKey="search" showSearchHint />
    </Suspense>
  );
}
