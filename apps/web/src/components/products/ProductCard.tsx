"use client";

import { useState, type MouseEvent } from "react";
import { Heart, Info, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Product } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { useWishlist } from "@/lib/wishlist";
import { getValidSale, isOutOfStock } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import { ProductCover } from "./ProductCover";
import { ProductMiniDetails } from "./ProductMiniDetails";

type Props = { product: Product; index?: number; className?: string };

export function ProductCard({ product, className }: Props) {
  const t = useTranslations("Catalog");
  const tNav = useTranslations("Nav");
  const ar = useLocale() === "ar";
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggle } = useWishlist();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const out = isOutOfStock(product);
  const sale = getValidSale(product);
  const wished = isWishlisted(product.id);
  const kind =
    product.kind === "TOP_UP"
      ? t("directTopUps")
      : product.kind === "GIFT_CARD"
        ? t("giftCard")
        : product.kind === "SERVICE"
          ? t("service")
          : t("gameKey");

  async function onWish(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if ((await toggle(product.id)) === "login") router.push("/login");
    } catch {
      /* keep UI stable */
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -6 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={cn(
        "gm-product-card group relative flex flex-col",
        out && "opacity-75",
        className,
      )}
      onMouseLeave={() => setPreview(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.04]"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-t-[var(--gm-radius-card)]">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[3/4] overflow-hidden bg-[var(--gm-bg-raised)]"
          tabIndex={-1}
          aria-hidden
        >
          <ProductCover
            imageUrl={product.imageUrl}
            title={product.title}
            platform={product.platform}
            className="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[rgba(9,6,16,0.88)] via-[rgba(9,6,16,0.12)] to-transparent"
            aria-hidden
          />

          {sale.discountPct ? (
            <span className="gm-num absolute start-2.5 top-2.5 rounded-md bg-[var(--gm-violet-600)] px-1.5 py-0.5 text-[11px] font-extrabold tracking-tight text-white shadow-[0_4px_14px_rgba(139,61,255,0.4)]">
              -{sale.discountPct}%
            </span>
          ) : product.isNew ? (
            <span className="absolute start-2.5 top-2.5 rounded-md bg-[var(--gm-violet-600)] px-1.5 py-0.5 text-[11px] font-bold text-white">
              {t("new")}
            </span>
          ) : null}

          {out ? (
            <span className="absolute inset-x-2.5 bottom-2.5 rounded-md bg-[rgba(8,4,16,0.72)] px-2 py-1 text-center text-[11px] font-semibold text-[var(--gm-text-secondary)] backdrop-blur-sm">
              {t("outOfStock")}
            </span>
          ) : null}
        </Link>

        <div className="absolute end-2.5 top-2.5 z-[2] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onWish}
            disabled={busy}
            aria-pressed={wished}
            aria-label={tNav("wishlist")}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[rgba(8,4,16,0.55)] text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-[rgba(165,107,255,0.45)] hover:bg-[rgba(8,4,16,0.8)] active:scale-95",
              wished && "border-[rgba(165,107,255,0.55)] text-[var(--gm-violet-400)]",
            )}
          >
            <Heart className="h-3.5 w-3.5" fill={wished ? "currentColor" : "none"} aria-hidden />
          </button>

          <button
            type="button"
            aria-label={ar ? "تفاصيل سريعة" : "Quick details"}
            aria-expanded={preview}
            onMouseEnter={() => setPreview(true)}
            onFocus={() => setPreview(true)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPreview((v) => !v);
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[rgba(8,4,16,0.55)] text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-[rgba(165,107,255,0.45)] hover:bg-[rgba(8,4,16,0.8)] active:scale-95",
              preview && "border-[rgba(165,107,255,0.55)] text-[var(--gm-violet-300)]",
            )}
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <ProductMiniDetails product={product} kindLabel={kind} open={preview} />
      </div>

      <div className="relative flex flex-1 flex-col gap-2.5 overflow-hidden rounded-b-[var(--gm-radius-card)] p-3.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            dir="ltr"
            className="inline-flex max-w-full truncate rounded-md border border-[var(--gm-border)] bg-[rgba(139,61,255,0.08)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gm-violet-300)]"
          >
            {product.platform}
          </span>
          <span className="text-[10px] font-medium text-[var(--gm-text-muted)]">{kind}</span>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.6rem] text-[13px] font-semibold leading-snug text-[var(--gm-text)] transition-colors hover:text-[var(--gm-violet-300)]"
        >
          <span dir="auto">{product.title}</span>
        </Link>

        {!out ? (
          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--gm-success)]">
            <Zap className="h-3 w-3 shrink-0" aria-hidden />
            {ar ? "تسليم فوري" : "Instant delivery"}
          </p>
        ) : (
          <p className="text-[11px] font-medium text-[var(--gm-text-muted)]">{t("outOfStock")}</p>
        )}

        <div
          className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--gm-border)] pt-2.5"
          dir={ar ? "rtl" : "ltr"}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            {sale.compareAt ? (
              <span className="gm-num text-[11px] text-[var(--gm-text-muted)] line-through">
                {formatPrice(sale.compareAt)}
              </span>
            ) : null}
            <span className="gm-num text-[17px] font-bold tracking-tight text-[var(--gm-text)]">
              {formatPrice(sale.current)}
            </span>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="mb-0.5 rounded-full bg-[var(--gm-accent-dim)] px-2.5 py-1 text-[10px] font-medium text-[var(--gm-violet-300)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            {ar ? "عرض" : "View"}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
