"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function LocaleNotFound() {
  const t = useTranslations("NotFound");
  const tCatalog = useTranslations("Catalog");

  return (
    <StoreShell>
      <div className="gm-container py-16">
        <EmptyState
          title={t("title")}
          description={t("description")}
          action={
            <Link href="/shop">
              <Button variant="primary">{tCatalog("shop")}</Button>
            </Link>
          }
        />
      </div>
    </StoreShell>
  );
}
