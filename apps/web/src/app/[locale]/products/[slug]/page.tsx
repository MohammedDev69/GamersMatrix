"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getProductBySlug,
  listRelatedProducts,
} from "@/lib/catalog/repository";
import { PRODUCT_ART_PLACEHOLDER } from "@/lib/catalog/fixtures";
import type { Product } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { useWishlist } from "@/lib/wishlist";
import { getValidSale, isOutOfStock } from "@/lib/pricing";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const t = useTranslations("Product");
  const tCatalog = useTranslations("Catalog");
  const tNav = useTranslations("Nav");
  const tCommon = useTranslations("Common");
  const { user } = useAuth();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggle } = useWishlist();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setImgFailed(false);
    getProductBySlug(slug, locale)
      .then(async (res) => {
        if (!res.product) {
          setNotFound(true);
          setProduct(null);
          return;
        }
        setProduct(res.product);
        const rel = await listRelatedProducts(res.product, locale, 6);
        setRelated(rel);
      })
      .catch(() => {
        setNotFound(true);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [slug, locale]);

  async function handleAdd() {
    if (!product) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await addItem(product.id, 1);
      setMsg("ok");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : tCommon("error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleWish() {
    if (!product || wishBusy) return;
    setWishBusy(true);
    try {
      const result = await toggle(product.id);
      if (result === "login") router.push("/login");
    } finally {
      setWishBusy(false);
    }
  }

  if (loading) {
    return (
      <StoreShell>
        <div className="gm-container grid gap-8 py-8 md:grid-cols-[360px_1fr]">
          <Skeleton className="aspect-square w-full rounded-[var(--gm-radius-card)]" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </StoreShell>
    );
  }

  if (notFound || !product) {
    return (
      <StoreShell>
        <div className="gm-container py-10">
          <EmptyState
            title={t("notFound")}
            description={t("notFoundHint")}
            action={
              <Link href="/shop">
                <Button variant="secondary">{tCatalog("shop")}</Button>
              </Link>
            }
          />
        </div>
      </StoreShell>
    );
  }

  const sale = getValidSale(product);
  const outOfStock = isOutOfStock(product);
  const wished = isWishlisted(product.id);

  return (
    <StoreShell>
      <div className="gm-container py-8">
        <div className="grid gap-8 md:grid-cols-[360px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--gm-radius-card)] ring-1 ring-[var(--gm-border)] md:aspect-square">
            <Image
              src={imgFailed ? PRODUCT_ART_PLACEHOLDER : product.imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              priority
              onError={() => setImgFailed(true)}
            />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>
                <span dir="ltr">{product.platform}</span>
              </Badge>
              {product.kind ? (
                <Badge tone="info">
                  {product.kind === "TOP_UP"
                    ? tCatalog("directTopUps")
                    : product.kind === "GIFT_CARD"
                      ? tCatalog("giftCard")
                      : product.kind === "SERVICE"
                        ? tCatalog("service")
                        : tCatalog("gameKey")}
                </Badge>
              ) : null}
              {outOfStock ? (
                <Badge tone="danger">{t("outOfStock")}</Badge>
              ) : (
                <Badge tone="success">{t("inStock")}</Badge>
              )}
              {sale.discountPct ? (
                <Badge tone="warning">-{sale.discountPct}%</Badge>
              ) : null}
            </div>

            <h1 className="gm-display text-3xl font-extrabold text-[var(--gm-text)] md:text-4xl">
              <span dir="auto">{product.title}</span>
            </h1>
            <p className="leading-7 text-[var(--gm-text-secondary)]">
              {product.description}
            </p>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold tabular-nums text-[var(--gm-text)]">
                {formatPrice(sale.current)}
              </span>
              {sale.compareAt ? (
                <span className="text-lg text-[var(--gm-text-muted)] line-through tabular-nums">
                  {formatPrice(sale.compareAt)}
                </span>
              ) : null}
            </div>

            <div className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4">
              <h2 className="text-sm font-bold text-[var(--gm-violet-300)]">
                {t("deliveryNote")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--gm-text-secondary)]">
                {product.deliveryNote || t("deliveryDefault")}
              </p>
              <p className="mt-3 text-xs text-[var(--gm-text-muted)]">
                {t("regionNotice")}
              </p>
            </div>

            <div className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4">
              <h2 className="text-sm font-bold text-[var(--gm-text)]">
                {t("policies")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--gm-text-secondary)]">
                {t("policiesBody")}{" "}
                <Link
                  href="/refund-policy"
                  className="text-[var(--gm-violet-300)] underline"
                >
                  {t("refundLink")}
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                disabled={busy || outOfStock}
                loading={busy}
                onClick={handleAdd}
              >
                {outOfStock ? t("outOfStock") : t("addToCart")}
              </Button>
              <Button
                variant="secondary"
                loading={wishBusy}
                onClick={handleWish}
                aria-pressed={wished}
              >
                <Heart
                  className="h-4 w-4"
                  fill={wished ? "currentColor" : "none"}
                  aria-hidden
                />
                {tNav("wishlist")}
              </Button>
              <Link href="/cart">
                <Button variant="outline">{tNav("cart")}</Button>
              </Link>
            </div>
            {msg === "ok" ? (
              <p className="text-sm text-[var(--gm-success)]" role="status">
                {t("addedOk")}
              </p>
            ) : null}
            {msg && msg !== "ok" ? (
              <p className="text-sm text-[var(--gm-danger)]" role="alert">
                {msg}
              </p>
            ) : null}
          </div>
        </div>

        {related.length > 0 ? (
          <div className="mt-12">
            <SectionHeading title={t("related")} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </StoreShell>
  );
}
