"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DotWaveBackground } from "./DotWaveBackground";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";

export function StoreShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Common");
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-[var(--gm-text)]">
      <DotWaveBackground />
      <a href="#main-content" className="gm-skip-link">{t("skipToContent")}</a>
      <Header />
      <main id="main-content" className="relative z-[1] flex-1" tabIndex={-1}>{children}</main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
