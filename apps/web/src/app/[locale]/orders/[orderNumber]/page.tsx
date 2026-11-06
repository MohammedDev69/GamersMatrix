"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { api, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import { usePublicStoreConfig } from "@/lib/store-config";

type TimelineEvent = {
  key: string;
  at: string;
  label: string;
  state: "done" | "current" | "pending" | "failed";
};

type OrderDetail = Order & {
  timeline?: TimelineEvent[];
};

export default function OrderDetailPage() {
  const t = useTranslations("OrderDetail");
  const params = useParams();
  const orderNumber = String(params.orderNumber || "");
  const { user, loading } = useAuth();
  const { formatPrice } = useCurrency();
  const { config } = usePublicStoreConfig();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !orderNumber) return;
    api
      .get<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}`)
      .then(setOrder)
      .catch((e) => {
        setError(e instanceof Error ? e.message : t("loadFailed"));
        setOrder(null);
      });
  }, [user, orderNumber, t]);

  if (loading || !user) {
    return (
      <StoreShell>
        <p className="p-8 text-[var(--gm-muted)]">...</p>
      </StoreShell>
    );
  }

  const wa = config?.supportWhatsApp;

  return (
    <StoreShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Link href="/account" className="text-sm text-[var(--gm-violet-400)]">
          ← {t("back")}
        </Link>

        {error ? (
          <p className="text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        {!order && !error ? (
          <p className="text-[var(--gm-muted)]">...</p>
        ) : null}

        {order ? (
          <>
            <div>
              <h1 className="font-mono text-xl font-bold text-white">
                {order.orderNumber || order.id}
              </h1>
              <p className="mt-1 text-sm text-[var(--gm-muted)]">
                {order.status} · {order.fulfillmentStatus || "PENDING"} ·{" "}
                {formatPrice(order.totalEGP)}
              </p>
            </div>

            <section className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5">
              <h2 className="mb-4 font-semibold text-white">{t("timeline")}</h2>
              <ol className="space-y-3">
                {(order.timeline || []).map((ev) => (
                  <li key={ev.key} className="flex gap-3 text-sm">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        ev.state === "done"
                          ? "bg-emerald-400"
                          : ev.state === "current"
                            ? "bg-[var(--gm-violet-400)]"
                            : ev.state === "failed"
                              ? "bg-rose-400"
                              : "bg-[var(--gm-border)]"
                      }`}
                      aria-hidden
                    />
                    <div>
                      <p className="text-white">{ev.label}</p>
                      <p className="text-xs text-[var(--gm-muted)]">
                        {new Date(ev.at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="font-semibold text-white">{t("items")}</h2>
              {order.isGift ? (
                <p className="rounded-lg border border-[var(--gm-border)] p-4 text-sm text-[var(--gm-muted)]">
                  {t("giftNote")}
                  {order.recipientName ? ` (${order.recipientName})` : ""}
                </p>
              ) : (
                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3"
                    >
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm text-[var(--gm-muted)]">
                        {formatPrice(item.unitPriceEGP)} × {item.quantity}
                      </p>
                      {item.productKey &&
                      item.productKey.code &&
                      !(item.productKey as { hidden?: boolean }).hidden ? (
                        <p
                          className="mt-2 break-all font-mono text-sm text-[var(--gm-accent-bright)]"
                          dir="ltr"
                        >
                          {item.productKey.code}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--gm-muted)]">
                          {t("codePending")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5">
              <h2 className="font-semibold text-white">{t("support")}</h2>
              <p className="mt-2 text-sm text-[var(--gm-muted)]">
                {t("supportHint")}
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--gm-text-secondary)]" dir="ltr">
                {order.orderNumber || order.id}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/support" className="gm-btn gm-btn-primary">
                  {t("supportCenter")}
                </Link>
                <Link href="/contact" className="gm-btn gm-btn-outline">
                  {t("contact")}
                </Link>
                {wa ? (
                  <a
                    href={`https://wa.me/${wa.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Order ${order.orderNumber || order.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gm-btn gm-btn-outline"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <p className="text-xs text-amber-300/90">{t("whatsappMissing")}</p>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </StoreShell>
  );
}
