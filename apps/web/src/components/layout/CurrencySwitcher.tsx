"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";

export function CurrencySwitcher() {
  const { currency, setCurrencyCode, formatPrice, detected } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1 px-2 text-sm text-[var(--gm-muted)] transition hover:text-white"
        aria-label="اختيار العملة"
        aria-expanded={open}
      >
        <span className="tabular-nums">{currency.code}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute end-0 top-[calc(100%+4px)] z-50 w-56 overflow-hidden rounded border border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="border-b border-[var(--gm-border)] px-3 py-2">
            <p className="text-xs text-[var(--gm-muted)]">
              {detected ? `مثال: ${formatPrice(1000)}` : "جاري التحميل..."}
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
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
                    className={`flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition ${
                      active ? "text-white" : "text-[var(--gm-muted)] hover:text-white"
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.nameAr}</span>
                    <span className="ms-auto text-xs text-[var(--gm-muted)]">{c.code}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
