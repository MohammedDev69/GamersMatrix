import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <CatalogPage titleKey="search" showSearchHint />
    </Suspense>
  );
}
