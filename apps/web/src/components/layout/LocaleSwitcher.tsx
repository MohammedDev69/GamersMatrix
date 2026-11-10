"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

const LABELS: Record<string, { short: string; name: string }> = {
  ar: { short: "ع", name: "العربية" },
  en: { short: "EN", name: "English" },
};

/* Shared style for both switchers — same height, border, radius, typography. */
const SWITCHER_TRIGGER =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--gm-border)] bg-[var(--gm-bg-raised)] px-2.5 text-xs font-bold text-[var(--gm-text-secondary)] transition-all duration-200 hover:border-[var(--gm-border-strong)] hover:text-[var(--gm-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-violet-500)]";

const SWITCHER_MENU =
  "absolute end-0 top-[calc(100%+6px)] z-50 min-w-[10.5rem] overflow-hidden rounded-[var(--gm-radius-card)] border border-[var(--gm-border-strong)] bg-[var(--gm-surface-raised)] shadow-[var(--gm-shadow-2)] will-change-transform";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function switchTo(next: "ar" | "en") {
    setOpen(false);
    if (next === locale) return;
    const qs = searchParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={SWITCHER_TRIGGER}
        aria-label={t("language")}
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5 text-[var(--gm-violet-400)]" aria-hidden />
        <span>{LABELS[locale]?.short}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          className={SWITCHER_MENU}
          role="menu"
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
          transition={{ duration: reduceMotion ? 0 : 0.12, ease: "easeOut" }}
        >
          {(["ar", "en"] as const).map((code) => {
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => switchTo(code)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--gm-accent-dim)] text-[var(--gm-text)]"
                    : "text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--gm-accent-dim)] text-[11px] font-extrabold text-[var(--gm-violet-300)]">
                  {LABELS[code].short}
                </span>
                <span>{LABELS[code].name}</span>
                {active ? <Check className="ms-auto h-4 w-4 text-[var(--gm-violet-400)]" aria-hidden /> : null}
              </button>
            );
          })}
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}
