"use client";

import { useTranslations } from "next-intl";
import { LegalPage } from "@/components/content/LegalPage";

export default function RefundPolicyPage() {
  const t = useTranslations("Refund");
  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      ownerNotice={t("ownerNotice")}
      sections={[
        { title: t("s1Title"), body: <p>{t("s1Body")}</p> },
        { title: t("s2Title"), body: <p>{t("s2Body")}</p> },
        { title: t("s3Title"), body: <p>{t("s3Body")}</p> },
      ]}
    />
  );
}
