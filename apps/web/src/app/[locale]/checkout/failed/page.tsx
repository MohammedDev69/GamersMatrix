"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";

function FailedContent() {
  const t = useTranslations("CheckoutFailed");
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <StoreShell>
      <div className="gm-card mx-auto max-w-lg space-y-4 p-6 text-center">
        <h1 className="text-2xl font-extrabold text-white">{t("title")}</h1>
        <p className="text-[var(--gm-muted)]">{t("body")}</p>
        {orderId ? (
          <p className="font-mono text-xs text-[var(--gm-muted)]">#{orderId}</p>
        ) : null}
        <Link href="/cart" className="gm-btn gm-btn-primary inline-flex">
          {t("retry")}
        </Link>
      </div>
    </StoreShell>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--gm-muted)]">...</div>}>
      <FailedContent />
    </Suspense>
  );
}
