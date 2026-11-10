"use client";

import { Zap } from "lucide-react";
import { useLocale } from "next-intl";
import type { Product } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { getValidSale, isOutOfStock } from "@/lib/pricing";
import { cn } from "@/lib/cn";

type Props = {
  product: Product;
  kindLabel: string;
  open: boolean;
  className?: string;
};

export function ProductMiniDetails({ product, kindLabel, open, className }: Props) {
  const ar = useLocale() === "ar";
  const { formatPrice } = useCurrency();
  const sale = getValidSale(product);
  const out = isOutOfStock(product);
  const blurb = (product.description || "").trim();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-2 bottom-2 z-[3] origin-bottom rounded-[12px] border border-[rgba(173,120,255,0.35)] bg-[rgba(10,6,18,0.92)] p-3 shadow-[0_16px_40px_rgba(4,2,10,0.55)] backdrop-blur-md transition-all duration-200",
        open
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-2 scale-[0.98] opacity-0",
        className,
      )}
      role="note"
      aria-hidden={!open}
    >
      <p className="line-clamp-1 text-[12px] font-semibold text-[var(--gm-text)]" dir="auto">
        {product.title}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--gm-text-muted)]">
        <span dir="ltr" className="rounded bg-[rgba(139,61,255,0.18)] px-1.5 py-0.5 font-semibold uppercase text-[var(--gm-violet-300)]">
          {product.platform}
        </span>
        <span>{kindLabel}</span>
        {product.avgRating != null ? (
          <span className="gm-num text-[var(--gm-deal)]">★ {product.avgRating}</span>
        ) : null}
      </div>
      {blurb ? (
        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[var(--gm-text-secondary)]" dir="auto">
          {blurb}
        </p>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--gm-border)] pt-2">
        <div className="flex items-baseline gap-1.5" dir={ar ? "rtl" : "ltr"}>
          <span className="gm-num text-sm font-bold text-[var(--gm-text)]">{formatPrice(sale.current)}</span>
          {sale.compareAt ? (
            <span className="gm-num text-[10px] text-[var(--gm-text-muted)] line-through">
              {formatPrice(sale.compareAt)}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium",
            out ? "text-[var(--gm-text-muted)]" : "text-[var(--gm-success)]",
          )}
        >
          {!out ? <Zap className="h-3 w-3" aria-hidden /> : null}
          {out ? (ar ? "غير متوفر" : "Out of stock") : ar ? "فوري" : "Instant"}
        </span>
      </div>
    </div>
  );
}
