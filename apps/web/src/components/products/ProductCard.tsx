"use client";

import Image from "next/image";
import { useState, type MouseEvent } from "react";
import { Heart, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Product } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { useWishlist } from "@/lib/wishlist";
import { getValidSale, isOutOfStock } from "@/lib/pricing";
import { PRODUCT_ART_PLACEHOLDER } from "@/lib/catalog/fixtures";
import { cn } from "@/lib/cn";

type Props = { product: Product; index?: number; className?: string };

export function ProductCard({ product, className }: Props) {
  const t = useTranslations("Catalog");
  const tNav = useTranslations("Nav");
  const ar = useLocale() === "ar";
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggle } = useWishlist();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const out = isOutOfStock(product);
  const sale = getValidSale(product);
  const wished = isWishlisted(product.id);
  const kind =
    product.kind === "TOP_UP" ? t("directTopUps") : product.kind === "GIFT_CARD" ? t("giftCard") : product.kind === "SERVICE" ? t("service") : t("gameKey");

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
    <article className={cn("group flex flex-col overflow-hidden rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] transition-colors hover:border-[var(--gm-violet-600)]", out && "opacity-70", className)}>
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-[var(--gm-bg-raised)]" tabIndex={-1} aria-hidden>
          <Image
            src={failed ? PRODUCT_ART_PLACEHOLDER : product.imageUrl}
            alt="" fill sizes="(max-width:768px) 45vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            onError={() => setFailed(true)}
          />
          {sale.discountPct ? (
            <span className="gm-num absolute start-2 top-2 rounded-[var(--gm-radius-sm)] bg-[var(--gm-deal)] px-1.5 py-0.5 text-xs font-extrabold text-[var(--gm-on-deal)]">-{sale.discountPct}%</span>
          ) : product.isNew ? (
            <span className="absolute start-2 top-2 rounded-[var(--gm-radius-sm)] bg-[var(--gm-violet-600)] px-1.5 py-0.5 text-xs font-bold text-white">{t("new")}</span>
          ) : null}
        </Link>
        <button
          type="button" onClick={onWish} disabled={busy} aria-pressed={wished} aria-label={tNav("wishlist")}
          className={cn("absolute end-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75", wished && "text-[var(--gm-danger)]")}
        >
          <Heart className="h-4 w-4" fill={wished ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="flex items-center justify-between gap-2 text-[11px] text-[var(--gm-text-muted)]">
          <span dir="ltr" className="truncate font-bold text-[var(--gm-violet-300)]">{product.platform}</span>
          <span className="shrink-0">{kind}</span>
        </p>
        <Link href={`/products/${product.slug}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug hover:text-[var(--gm-violet-300)]">
          <span dir="auto">{product.title}</span>
        </Link>
        <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--gm-success)]">
          <Zap className="h-3 w-3" aria-hidden />
          {out ? t("outOfStock") : ar ? "تسليم فوري" : "Instant delivery"}
        </p>
        <div className="mt-auto flex items-baseline gap-2 pt-1" dir={ar ? "rtl" : "ltr"}>
          <span className="gm-num text-lg font-extrabold">{formatPrice(sale.current)}</span>
          {sale.compareAt ? <span className="gm-num text-xs text-[var(--gm-text-muted)] line-through">{formatPrice(sale.compareAt)}</span> : null}
        </div>
      </div>
    </article>
  );
}
