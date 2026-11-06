"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

export type PublicStoreConfig = {
  storeName: string;
  defaultLocale: string;
  currencyCode: string;
  timezone: string;
  supportWhatsApp: string | null;
  supportEmail: string | null;
  publicNotice: string | null;
  configuration: {
    supportWhatsAppConfigured: boolean;
    supportEmailConfigured: boolean;
    publicNoticeConfigured: boolean;
    paymentProviderConfigured: boolean;
    emailDeliveryConfigured: boolean;
  };
  missingProductionHints: string[];
};

export function usePublicStoreConfig() {
  const [config, setConfig] = useState<PublicStoreConfig | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<PublicStoreConfig>("/store/public-config")
      .then(setConfig)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load store config"),
      );
  }, []);

  return { config, error };
}
