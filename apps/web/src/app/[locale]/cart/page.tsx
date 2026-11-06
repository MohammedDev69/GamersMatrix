"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { api, type Cart } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";

export default function CartPage() {
  const t = useTranslations("Cart");
  const { user } = useAuth();
  const { items, count, cart, updateItem, removeItem, refresh } = useCart();
  const { formatPrice, currency } = useCurrency();
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<Cart | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");

  const totals = quote || cart;
  const subtotal =
    totals?.subtotalEGP ??
    items.reduce((s, i) => s + Number(i.product?.priceEGP || 0) * i.quantity, 0);
  const discount = totals?.discountEGP ?? 0;
  const total = totals?.totalEGP ?? Math.max(0, subtotal - discount);

  async function applyCoupon(e: FormEvent) {
    e.preventDefault();
    if (!user || !coupon.trim()) return;
    setCouponBusy(true);
    setCouponMsg("");
    try {
      const data = await api.post<Cart>("/cart/quote", {
        couponCode: coupon.trim(),
      });
      setQuote(data);
      if (data.couponError) {
        setCouponMsg(data.couponError);
      } else if (data.couponCode) {
        setCouponMsg(data.couponCode);
      }
    } catch (err) {
      setCouponMsg(err instanceof Error ? err.message : "Coupon failed");
      setQuote(null);
    } finally {
      setCouponBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <h1 className="mb-4 text-2xl font-extrabold text-white">{t("title")}</h1>
        {!user ? (
          <div className="gm-card p-6">
            <p className="mb-4 text-[var(--gm-muted)]">سجّل الدخول لإدارة سلتك.</p>
            <Link href="/login" className="gm-btn gm-btn-primary">
              Login
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="gm-card p-6">
            <p className="mb-4 text-[var(--gm-muted)]">{t("empty")}</p>
            <Link href="/shop" className="gm-btn gm-btn-primary">
              {t("continue")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="gm-card flex gap-3 p-3">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-bold text-white hover:text-[var(--gm-accent-bright)]"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-[var(--gm-accent-bright)]">
                      {formatPrice(item.product.priceEGP)}
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={async (e) => {
                          await updateItem(item.id, Number(e.target.value) || 1);
                          setQuote(null);
                          await refresh();
                        }}
                        className="gm-input w-20"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await removeItem(item.id);
                          setQuote(null);
                        }}
                        className="text-sm text-rose-400 hover:text-rose-300"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="gm-card h-fit space-y-4 p-5">
              <h2 className="text-lg font-bold text-white">{t("total")}</h2>
              <p className="text-sm text-[var(--gm-muted)]">
                {count} · {currency.code}
              </p>
              <form onSubmit={applyCoupon} className="flex gap-2">
                <input
                  className="gm-input flex-1"
                  placeholder={t("coupon")}
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={couponBusy}
                  className="gm-btn gm-btn-outline shrink-0"
                >
                  {t("applyCoupon")}
                </button>
              </form>
              {couponMsg ? (
                <p
                  className={`text-xs ${
                    totals?.couponError ? "text-rose-400" : "text-[var(--gm-accent-bright)]"
                  }`}
                >
                  {couponMsg}
                </p>
              ) : null}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-[var(--gm-muted)]">
                  <span>{t("subtotal")}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-[var(--gm-accent-bright)]">
                    <span>{t("discount")}</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-xl font-extrabold text-white">
                  <span>{t("total")}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--gm-muted)]">{t("egpNote")}</p>
              <p className="text-[11px] text-[var(--gm-muted)]">{t("digitalNote")}</p>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    coupon.trim()
                      ? `/checkout?coupon=${encodeURIComponent(coupon.trim())}`
                      : "/checkout",
                  )
                }
                className="gm-btn gm-btn-primary w-full"
              >
                {t("checkout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </StoreShell>
  );
}
