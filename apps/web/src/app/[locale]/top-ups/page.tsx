import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";

export default function TopUpsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--gm-muted)]">...</div>}>
      <CatalogPage titleKey="topUps" fixedKind="TOP_UP" />
    </Suspense>
  );
}
