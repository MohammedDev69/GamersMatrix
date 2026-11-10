"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { listProducts } from "@/lib/catalog/repository";
import { useCurrency } from "@/lib/currency";
import { getValidSale } from "@/lib/pricing";
import { getProductImageUrl } from "@/lib/product-image";
import type { Product } from "@/lib/api";
import { cn } from "@/lib/cn";

type Props = { className?: string };

const searchFieldShell =
  "group relative rounded-full bg-gradient-to-r from-[rgba(173,120,255,0.30)] via-[rgba(139,61,255,0.10)] to-[rgba(173,120,255,0.30)] p-px transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(139,61,255,0.4),0_4px_28px_rgba(139,61,255,0.28)]";

/**
 * Central search experience: debounced live suggestions from the real
 * catalog API — loading, empty and "view all" states included.
 * Press "/" anywhere to focus it.
 */
export function HeaderSearch({ className }: Props) {
  const t = useTranslations("Nav");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "empty">("idle");
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setStatus("idle");
      setItems([]);
      setOpen(false);
      return;
    }

    const id = ++requestRef.current;
    setStatus("loading");
    setOpen(true);

    async function run() {
      try {
        const res = await listProducts({ search: term, lang: locale, pageSize: 6, limit: 6 });
        if (id !== requestRef.current) return; // stale
        setItems(res.items.slice(0, 6));
        setStatus(res.items.length > 0 ? "done" : "empty");
      } catch {
        if (id !== requestRef.current) return;
        setItems([]);
        setStatus("empty");
      }
    }

    const timer = window.setTimeout(run, 250);
    return () => window.clearTimeout(timer);
  }, [q, locale]);

  // Close on outside interaction
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // "/" focuses the search from anywhere (when not already typing)
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = q.trim();
    setOpen(false);
    router.push(v ? `/search?q=${encodeURIComponent(v)}` : "/search");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.focus();
    }
  }

  const showPanel = open && (status === "loading" || status === "done" || status === "empty");

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <form onSubmit={submit} role="search">
        <label htmlFor="gm-search" className="sr-only">{t("search")}</label>
        <div className={searchFieldShell}>
          <div className="relative flex items-center">
            <span
              className="pointer-events-none absolute start-2 z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gm-accent-dim)] text-[var(--gm-violet-400)] transition-colors group-focus-within:bg-[rgba(139,61,255,0.28)]"
              aria-hidden
            >
              <Search className="h-4 w-4" />
            </span>
            <input
              ref={inputRef}
              id="gm-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => { if (q.trim().length >= 2) setOpen(true); }}
              placeholder={tHome("searchPlaceholder")}
              autoComplete="off"
              className="gm-input gm-header-search-input !min-h-11 !rounded-full !border-transparent !bg-transparent !shadow-none focus:!border-transparent focus:!shadow-none"
            />
            {status === "loading" ? (
              <Loader2 className="absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--gm-violet-400)]" aria-hidden />
            ) : (
              <kbd className="gm-num pointer-events-none absolute end-4 hidden h-5 min-w-5 items-center justify-center rounded-[6px] border border-[var(--gm-border)] bg-[rgba(255,255,255,0.03)] px-1 text-[10px] font-bold text-[var(--gm-text-muted)] transition-opacity group-focus-within:opacity-0 lg:flex" aria-hidden>
                /
              </kbd>
            )}
          </div>
        </div>
      </form>

      <AnimatePresence>
      {showPanel ? (
        <motion.div
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[var(--gm-radius-card)] border border-[var(--gm-border-strong)] bg-[var(--gm-surface-raised)] shadow-[var(--gm-shadow-2)]"
          role="listbox"
          aria-label={t("search")}
          initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -5, scale: 0.995 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {status === "loading" ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[var(--gm-radius-btn)] p-2">
                  <span className="gm-skeleton h-11 w-11 shrink-0 rounded-[var(--gm-radius-btn)]" />
                  <span className="flex-1 space-y-1.5">
                    <span className="gm-skeleton block h-3 w-3/4 rounded-full" />
                    <span className="gm-skeleton block h-2.5 w-1/3 rounded-full" />
                  </span>
                </div>
              ))}
            </div>
          ) : status === "empty" ? (
            <p className="p-5 text-center text-sm text-[var(--gm-text-muted)]">{t("noResults")}</p>
          ) : (
            <ul className="max-h-[380px] space-y-0.5 overflow-y-auto p-2">
              {items.map((p) => {
                const sale = getValidSale(p);
                const imageUrl = getProductImageUrl(p.imageUrl);
                return (
                  <li key={p.id} role="option" aria-selected={false}>
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-[var(--gm-radius-btn)] p-2 transition-colors hover:bg-[var(--gm-surface-hover)]"
                    >
                      {imageUrl ? (
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[var(--gm-radius-btn)] bg-[var(--gm-surface)]">
                          <Image src={imageUrl} alt="" fill sizes="44px" className="object-cover" />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold" dir="auto">{p.title}</span>
                        <span className="block text-[11px] text-[var(--gm-text-muted)]" dir="ltr">{p.platform}</span>
                      </span>
                      <span className="gm-num shrink-0 text-sm font-extrabold text-[var(--gm-violet-300)]">
                        {formatPrice(sale.current)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {status === "done" ? (
            <Link
              href={`/search?q=${encodeURIComponent(q.trim())}`}
              onClick={() => setOpen(false)}
              className="block border-t border-[var(--gm-border)] px-4 py-3 text-center text-sm font-bold text-[var(--gm-violet-400)] transition-colors hover:bg-[var(--gm-accent-dim)] hover:text-[var(--gm-violet-300)]"
            >
              {t("viewResults")}
            </Link>
          ) : null}
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Compact mobile search — navigates to the results page (no dropdown). */
export function MobileSearch({ className }: Props) {
  const t = useTranslations("Nav");
  const tHome = useTranslations("Home");
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/search?q=${encodeURIComponent(v)}` : "/search");
  }

  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <label htmlFor="gm-search-m" className="sr-only">{t("search")}</label>
      <div className={searchFieldShell}>
        <div className="relative flex items-center">
          <span
            className="pointer-events-none absolute start-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gm-accent-dim)] text-[var(--gm-violet-400)]"
            aria-hidden
          >
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            id="gm-search-m"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tHome("searchPlaceholder")}
            aria-label={t("search")}
            autoComplete="off"
            className="gm-input gm-header-search-input-sm !min-h-10 !rounded-full !border-transparent !bg-transparent !shadow-none focus:!border-transparent focus:!shadow-none"
          />
        </div>
      </div>
    </form>
  );
}
