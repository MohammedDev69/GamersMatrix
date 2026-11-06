"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { api, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";

function SuccessContent() {
  const t = useTranslations("Success");
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const mock = params.get("mock") === "1";
  const pendingParam = params.get("pending") === "1";
  const { user, loading } = useAuth();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId || loading) return;
    if (!user) {
      setError("Sign in to view order details");
      return;
    }
    api
      .get<Order>(`/orders/${orderId}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [orderId, user, loading]);

  const isGift = order?.isGift === true;
  const pending =
    pendingParam ||
    order?.status === "PENDING" ||
    order?.payment?.status === "PENDING";

  return (
    <StoreShell>
      <div className="gm-card mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-extrabold text-white">
          {isGift ? t("giftTitle") : t("title")}
        </h1>
        {mock ? (
          <p className="text-sm text-[var(--gm-accent-bright)]">{t("mock")}</p>
        ) : null}
        {pending && !mock ? (
          <p className="text-sm text-amber-300">{t("pending")}</p>
        ) : null}
        {error ? <p className="text-rose-400">{error}</p> : null}
        {order ? (
          <>
            <p className="text-[var(--gm-muted)]">
              #{order.id.slice(-8)} — {formatPrice(order.totalEGP)} — {order.status}
            </p>
            {isGift ? (
              <div className="rounded-xl border border-[var(--gm-border)] bg-black/20 p-4 text-sm text-[var(--gm-muted)]">
                <p className="text-white">{t("giftMessage")}</p>
                {order.recipientName ? (
                  <p className="mt-2">
                    {order.recipientName}
                    {order.recipientEmail ? ` · ${order.recipientEmail}` : ""}
                    {order.recipientWhatsApp
                      ? ` · ${order.recipientWhatsApp}`
                      : ""}
                  </p>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[var(--gm-border)] p-3"
                  >
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="mt-1 font-mono text-[var(--gm-accent-bright)]">
                      {item.productKey &&
                      !(item.productKey as { hidden?: boolean }).hidden
                        ? item.productKey.code
                        : t("codePending")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : !error ? (
          <p className="text-[var(--gm-muted)]">...</p>
        ) : null}
        <div className="flex gap-3">
          <Link href="/account" className="gm-btn gm-btn-primary">
            {t("orders")}
          </Link>
          <Link href="/shop" className="gm-btn gm-btn-outline">
            {t("continue")}
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--gm-muted)]">...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
