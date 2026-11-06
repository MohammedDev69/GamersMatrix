"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTo(next: "ar" | "en") {
    if (next === locale) return;
    const qs = searchParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next });
  }

  return (
    <div
      className="flex items-center rounded-full border border-[var(--gm-border)] bg-black/20 p-0.5 text-xs font-semibold"
      role="group"
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => switchTo("ar")}
        aria-pressed={locale === "ar"}
        aria-label="العربية"
        className={`min-h-9 min-w-9 rounded-full px-2.5 py-1 transition ${locale === "ar" ? "bg-[var(--gm-accent)] text-white" : "text-[var(--gm-muted)] hover:text-white"}`}
      >
        ع
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
        aria-label="English"
        className={`min-h-9 min-w-9 rounded-full px-2.5 py-1 transition ${locale === "en" ? "bg-[var(--gm-accent)] text-white" : "text-[var(--gm-muted)] hover:text-white"}`}
      >
        EN
      </button>
    </div>
  );
}
