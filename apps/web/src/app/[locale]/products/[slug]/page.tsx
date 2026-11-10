"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGallery } from "@/components/products/ProductGallery";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getProductBySlug,
  listRelatedProducts,
} from "@/lib/catalog/repository";
import type { Product } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { useWishlist } from "@/lib/wishlist";
import { getValidSale, isOutOfStock } from "@/lib/pricing";
import { cn } from "@/lib/cn";

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
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedNear, setRelatedNear] = useState(false);
  const relatedRef = useRef<HTMLElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setRelated([]);
    setRelatedLoading(false);
    setRelatedNear(false);
    getProductBySlug(slug, locale)
      .then(async (res) => {
        if (!res.product) {
          setNotFound(true);
          setProduct(null);
          return;
        }
        setProduct(res.product);
      })
      .catch(() => {
        setNotFound(true);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [slug, locale]);

  // Lazy loading: "related products" sit below the fold — observe the
  // section and only fetch when the visitor approaches it.
  useEffect(() => {
    if (!product || relatedNear) return;
    if (typeof IntersectionObserver === "undefined") {
      setRelatedNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRelatedNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    const el = relatedRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [product, relatedNear]);

  useEffect(() => {
    if (!product || !relatedNear) return;
    let cancelled = false;
    setRelatedLoading(true);
    listRelatedProducts(product, locale, 6)
      .then((rel) => {
        if (!cancelled) setRelated(rel);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product, locale, relatedNear]);

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
        <div className={cn("grid gap-8 md:grid-cols-[minmax(280px,420px)_1fr]")}>
          <ProductGallery
            title={product.title}
            platform={product.platform}
            imageUrl={product.imageUrl}
            galleryUrls={[product.ogImageUrl]}
          />
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

        <section ref={relatedRef} className="mt-12">
          <SectionHeading title={t("related")} />
          {relatedLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, n) => (
                <div key={n} className="space-y-2">
                  <Skeleton className="aspect-[3/4.4] rounded-[var(--gm-radius-card)]" />
                  <Skeleton className="h-3.5 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : related.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </StoreShell>
  );
}
