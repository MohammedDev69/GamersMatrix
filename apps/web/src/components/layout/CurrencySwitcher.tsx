"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";

/* Shared style — identical height/border/radius/typography to LocaleSwitcher. */
const SWITCHER_TRIGGER =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--gm-border)] bg-[var(--gm-bg-raised)] px-2.5 text-xs font-bold text-[var(--gm-text-secondary)] transition-all duration-200 hover:border-[var(--gm-border-strong)] hover:text-[var(--gm-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-violet-500)]";

const SWITCHER_MENU =
  "absolute end-0 top-[calc(100%+6px)] z-50 min-w-[12rem] overflow-hidden rounded-[var(--gm-radius-card)] border border-[var(--gm-border-strong)] bg-[var(--gm-surface-raised)] shadow-[var(--gm-shadow-2)] will-change-transform";

export function CurrencySwitcher() {
  const { currency, setCurrencyCode, formatPrice, detected } = useCurrency();
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={SWITCHER_TRIGGER}
        aria-label="اختيار العملة"
        aria-expanded={open}
      >
        <span className="gm-num">{currency.code}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          className={SWITCHER_MENU}
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
          transition={{ duration: reduceMotion ? 0 : 0.12, ease: "easeOut" }}
        >
          <p className="border-b border-[var(--gm-border)] px-3.5 py-2.5 text-[11px] text-[var(--gm-text-muted)]">
            {detected ? `مثال: ${formatPrice(1000)}` : "…"}
          </p>
          <ul className="max-h-64 overflow-y-auto p-1">
            {CURRENCIES.map((c) => {
              const active = c.code === currency.code;
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrencyCode(c.code as CurrencyCode);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-[6px] px-3.5 py-2 text-start text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--gm-accent-dim)] text-[var(--gm-text)]"
                        : "text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]"
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span className="font-semibold">{c.nameAr}</span>
                    <span className="gm-num ms-auto text-[11px] text-[var(--gm-text-muted)]">{c.code}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}
