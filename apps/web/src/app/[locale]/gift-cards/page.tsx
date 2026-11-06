import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";

export default function GiftCardsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--gm-muted)]">...</div>}>
      <CatalogPage titleKey="giftCards" fixedKind="GIFT_CARD" />
    </Suspense>
  );
}
