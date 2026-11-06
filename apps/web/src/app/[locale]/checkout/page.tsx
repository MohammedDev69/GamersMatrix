"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { api, type Cart, type CheckoutResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";

function CheckoutForm() {
  const t = useTranslations("Checkout");
  const tCart = useTranslations("Cart");
  const { user, loading } = useAuth();
  const { items, cart, refresh } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoupon = searchParams.get("coupon") || "";

  const [couponCode, setCouponCode] = useState(initialCoupon);
  const [quote, setQuote] = useState<Cart | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [method, setMethod] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [recipientWhatsApp, setRecipientWhatsApp] = useState("");
  const [confirmWhatsApp, setConfirmWhatsApp] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.post<Cart>("/cart/quote", {
          couponCode: couponCode || undefined,
        });
        if (!cancelled) setQuote(data);
      } catch {
        if (!cancelled) setQuote(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, couponCode, items.length]);

  const totals = quote || cart;
  const subtotal =
    totals?.subtotalEGP ??
    items.reduce((s, i) => s + Number(i.product?.priceEGP || 0) * i.quantity, 0);
  const discount = totals?.discountEGP ?? 0;
  const totalEGP = totals?.totalEGP ?? Math.max(0, subtotal - discount);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!user) {
      setError(t("loginRequired"));
      return;
    }

    if (!acceptTerms) {
      setError(t("termsRequired"));
      return;
    }

    if (isGift) {
      if (!recipientName.trim()) {
        setError(t("recipientName"));
        return;
      }
      if (method === "EMAIL") {
        if (!recipientEmail.trim() || recipientEmail !== confirmEmail) {
          setError(t("emailMismatch"));
          return;
        }
      } else if (!recipientWhatsApp.trim() || !confirmWhatsApp) {
        setError(t("whatsappRequired"));
        return;
      }
    }

    setBusy(true);
    try {
      const body = {
        acceptTerms: true,
        couponCode: couponCode.trim() || undefined,
        ...(isGift
          ? {
              isGift: true,
              giftDeliveryMethod: method,
              recipientName: recipientName.trim(),
              recipientEmail:
                method === "EMAIL" ? recipientEmail.trim() : undefined,
              recipientWhatsApp:
                method === "WHATSAPP" ? recipientWhatsApp.trim() : undefined,
              giftMessage: giftMessage.trim() || undefined,
            }
          : { isGift: false }),
      };

      const res = await api.post<CheckoutResponse>("/orders/checkout", body);
      await refresh();
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        router.push(`/checkout/success?orderId=${res.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <StoreShell>
        <p className="p-8 text-[var(--gm-muted)]">...</p>
      </StoreShell>
    );
  }

  if (!user) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-[var(--gm-muted)]">{t("loginRequired")}</p>
          <Link href="/login" className="gm-btn gm-btn-primary mt-4 inline-flex">
            Login
          </Link>
        </div>
      </StoreShell>
    );
  }

  if (!items.length) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-[var(--gm-muted)]">{tCart("empty")}</p>
          <Link href="/shop" className="gm-btn gm-btn-primary mt-4 inline-flex">
            {tCart("continue")}
          </Link>
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <div className="mx-auto grid max-w-[1000px] gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="space-y-6">
          <h1 className="gm-display text-3xl font-extrabold text-white">
            {t("title")}
          </h1>

          <div className="rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5">
            <h2 className="mb-3 font-semibold text-white">{t("contact")}</h2>
            <p className="text-sm text-[var(--gm-muted)]">
              {user.name} · {user.email}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5 space-y-3">
            <h2 className="font-semibold text-white">{t("paymentMethod")}</h2>
            <p className="text-sm text-white">{t("paymob")}</p>
            <p className="text-xs text-[var(--gm-muted)]">{t("regionNote")}</p>
            <label className="block text-sm text-[var(--gm-muted)]">
              {tCart("coupon")}
              <input
                className="gm-input mt-1"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
            </label>
            {quote?.couponError ? (
              <p className="text-xs text-rose-400">{quote.couponError}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-white">
                  {t("sendAsGift")}
                </span>
                <span className="text-sm text-[var(--gm-muted)]">
                  {t("sendAsGiftHint")}
                </span>
              </span>
            </label>

            {isGift ? (
              <div className="mt-5 space-y-4 border-t border-[var(--gm-border)] pt-5">
                <div>
                  <p className="mb-2 text-sm text-[var(--gm-muted)]">
                    {t("deliveryMethod")}
                  </p>
                  <div className="flex gap-2">
                    {(["EMAIL", "WHATSAPP"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                          method === m
                            ? "bg-white text-black"
                            : "bg-white/5 text-[var(--gm-muted)]"
                        }`}
                      >
                        {m === "EMAIL" ? t("email") : t("whatsapp")}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  className="gm-input"
                  placeholder={t("recipientName")}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />

                {method === "EMAIL" ? (
                  <>
                    <input
                      className="gm-input"
                      type="email"
                      placeholder={t("recipientEmail")}
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      required
                    />
                    <input
                      className="gm-input"
                      type="email"
                      placeholder={t("confirmEmail")}
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      required
                    />
                  </>
                ) : (
                  <>
                    <input
                      className="gm-input"
                      placeholder={t("recipientWhatsApp")}
                      value={recipientWhatsApp}
                      onChange={(e) => setRecipientWhatsApp(e.target.value)}
                      required
                    />
                    <label className="flex items-center gap-2 text-sm text-[var(--gm-muted)]">
                      <input
                        type="checkbox"
                        checked={confirmWhatsApp}
                        onChange={(e) => setConfirmWhatsApp(e.target.checked)}
                      />
                      {t("confirmWhatsApp")}
                    </label>
                  </>
                )}

                <textarea
                  className="gm-input min-h-24"
                  maxLength={150}
                  placeholder={t("giftMessage")}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                />
                <p className="text-end text-xs text-[var(--gm-muted)]">
                  {giftMessage.length}/150
                </p>
              </div>
            ) : null}
          </div>

          <label className="flex items-start gap-3 text-sm text-[var(--gm-muted)]">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1"
            />
            <span>
              {t("acceptTerms")} (
              <Link href="/terms" className="text-[var(--gm-accent-bright)]">
                terms
              </Link>
              {" · "}
              <Link
                href="/refund-policy"
                className="text-[var(--gm-accent-bright)]"
              >
                refund
              </Link>
              )
            </span>
          </label>

          {error ? (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="gm-btn gm-btn-primary w-full !py-3"
          >
            {busy ? "..." : t("pay")}
          </button>
          <p className="text-center text-xs text-[var(--gm-muted)]">
            {t("secureNote")}
          </p>
        </form>

        <aside className="h-fit rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5">
          <h2 className="mb-4 font-semibold text-white">{t("review")}</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-white">
                  {item.product.title} × {item.quantity}
                  {item.product.platform ? (
                    <span className="mt-0.5 block text-xs text-[var(--gm-muted)]">
                      {item.product.platform}
                    </span>
                  ) : null}
                </span>
                <span className="text-[var(--gm-muted)]">
                  {formatPrice(item.product.priceEGP * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-[var(--gm-border)] pt-4 text-sm">
            <div className="flex justify-between text-[var(--gm-muted)]">
              <span>{tCart("subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-[var(--gm-accent-bright)]">
                <span>{tCart("discount")}</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-bold text-white">
              <span>{tCart("total")}</span>
              <span>{formatPrice(totalEGP)}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--gm-muted)]">{tCart("egpNote")}</p>
        </aside>
      </div>
    </StoreShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--gm-muted)]">...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
