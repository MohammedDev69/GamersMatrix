"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";

export function StoreShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Common");
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-[var(--gm-text)]">
      <a href="#main-content" className="gm-skip-link">{t("skipToContent")}</a>
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
