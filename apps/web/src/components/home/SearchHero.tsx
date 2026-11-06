"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HeroBannerShell } from "@/components/ui/HeroBannerShell";
import { SearchField } from "@/components/ui/SearchField";
import { Button } from "@/components/ui/Button";

export function SearchHero() {
  const t = useTranslations("Home");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [q, setQ] = useState("");

  function go(value: string) {
    const query = value.trim();
    router.push(
      query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    );
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <div className="gm-container pb-6 pt-4 md:pb-8 md:pt-6">
      <HeroBannerShell
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        actions={
          <form
            onSubmit={onSearch}
            className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-stretch"
          >
            <SearchField
              label={t("searchPlaceholder")}
              clearLabel={tCommon("close")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ("")}
              onSubmitSearch={go}
              placeholder={t("searchPlaceholder")}
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="primary" className="shrink-0">
              {t("searchCta")}
            </Button>
          </form>
        }
      />
    </div>
  );
}
