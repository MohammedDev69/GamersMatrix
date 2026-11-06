"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { usePublicStoreConfig } from "@/lib/store-config";

export default function SupportPage() {
  const t = useTranslations("Support");
  const { config, error } = usePublicStoreConfig();
  const wa = config?.supportWhatsApp;
  const email = config?.supportEmail;

  return (
    <StoreShell>
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{t("title")}</h1>
          <p className="mt-2 text-[var(--gm-muted)]">{t("intro")}</p>
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <section className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-6">
          <h2 className="text-lg font-bold text-white">{t("contactTitle")}</h2>
          <p className="mt-2 text-sm text-[var(--gm-muted)]">{t("contactBody")}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {wa ? (
              <li>
                <a
                  href={`https://wa.me/${wa.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gm-btn gm-btn-primary"
                >
                  WhatsApp
                </a>
              </li>
            ) : (
              <li className="text-amber-300/90">{t("whatsappMissing")}</li>
            )}
            {email ? (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="text-[var(--gm-violet-400)]"
                  dir="ltr"
                >
                  {email}
                </a>
              </li>
            ) : (
              <li className="text-amber-300/90">{t("emailMissing")}</li>
            )}
          </ul>
          {config?.publicNotice ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--gm-text-secondary)]">
              {config.publicNotice}
            </p>
          ) : (
            <p className="mt-4 text-xs text-[var(--gm-muted)]">{t("noticeMissing")}</p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">{t("faqTitle")}</h2>
          <ul className="space-y-3">
            {(
              [
                ["faqDeliveryQ", "faqDeliveryA"],
                ["faqPayQ", "faqPayA"],
                ["faqGiftQ", "faqGiftA"],
              ] as const
            ).map(([q, a]) => (
              <li
                key={q}
                className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] px-5 py-4"
              >
                <h3 className="font-semibold text-white">{t(q)}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--gm-muted)]">
                  {t(a)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-6">
          <h2 className="text-lg font-bold text-white">{t("policyTitle")}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--gm-muted)]">
            {t("policyBody")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/account" className="gm-btn gm-btn-outline text-sm">
              {t("ordersLink")}
            </Link>
            <Link href="/refund-policy" className="gm-btn gm-btn-outline text-sm">
              {t("refundLink")}
            </Link>
            <Link href="/contact" className="gm-btn gm-btn-outline text-sm">
              {t("contactLink")}
            </Link>
          </div>
        </section>
      </div>
    </StoreShell>
  );
}
