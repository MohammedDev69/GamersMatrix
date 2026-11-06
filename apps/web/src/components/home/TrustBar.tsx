"use client";

import { ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { ServiceStrip } from "@/components/ui/ServiceStrip";

export function TrustBar() {
  const t = useTranslations("Home");

  return (
    <ServiceStrip
      items={[
        { icon: ShieldCheck, label: t("trustSecure") },
        { icon: Zap, label: t("trustInstant") },
        { icon: BadgeCheck, label: t("trustOriginal") },
      ]}
    />
  );
}
