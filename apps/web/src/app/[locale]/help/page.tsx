"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LegalPage } from "@/components/content/LegalPage";

export default function HelpPage() {
  const t = useTranslations("Help");

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      ownerNotice={t("ownerNotice")}
      sections={[
        {
          title: t("ordersTitle"),
          body: <p>{t("ordersBody")}</p>,
        },
        {
          title: t("deliveryTitle"),
          body: <p>{t("deliveryBody")}</p>,
        },
        {
          title: t("accountTitle"),
          body: <p>{t("accountBody")}</p>,
        },
        {
          title: t("contactTitle"),
          body: (
            <p>
              {t("contactBody")}{" "}
              <Link href="/contact" className="text-[var(--gm-violet-300)] underline">
                {t("contactLink")}
              </Link>
            </p>
          ),
        },
      ]}
    />
  );
}
