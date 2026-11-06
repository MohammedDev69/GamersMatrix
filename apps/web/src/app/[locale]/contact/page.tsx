"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LegalPage } from "@/components/content/LegalPage";
import { usePublicStoreConfig } from "@/lib/store-config";

export default function ContactPage() {
  const t = useTranslations("Contact");
  const { config } = usePublicStoreConfig();
  const wa = config?.supportWhatsApp?.replace(/[^\d]/g, "") || "";
  const email = config?.supportEmail;
  const waHref = wa ? `https://wa.me/${wa}` : null;

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      ownerNotice={t("ownerNotice")}
      sections={[
        {
          title: t("channelsTitle"),
          body: (
            <ul className="list-disc space-y-2 ps-5">
              <li>
                {t("whatsappLabel")}:{" "}
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--gm-violet-300)] underline"
                    dir="ltr"
                  >
                    {wa}
                  </a>
                ) : (
                  <span className="text-[var(--gm-warning)]">
                    {t("whatsappMissing")}
                  </span>
                )}
              </li>
              <li>
                {t("emailLabel")}:{" "}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="text-[var(--gm-violet-300)] underline"
                    dir="ltr"
                  >
                    {email}
                  </a>
                ) : (
                  <span className="text-[var(--gm-warning)]">
                    {t("emailMissing")}
                  </span>
                )}
              </li>
              <li>
                {t("supportLinkLabel")}:{" "}
                <Link
                  href="/support"
                  className="text-[var(--gm-violet-300)] underline"
                >
                  {t("supportLink")}
                </Link>
              </li>
              <li>
                {t("helpLinkLabel")}:{" "}
                <Link
                  href="/help"
                  className="text-[var(--gm-violet-300)] underline"
                >
                  {t("helpLink")}
                </Link>
              </li>
            </ul>
          ),
        },
        {
          title: t("hoursTitle"),
          body: (
            <p>
              {config?.publicNotice?.trim()
                ? config.publicNotice
                : t("hoursBody")}
            </p>
          ),
        },
      ]}
    />
  );
}
