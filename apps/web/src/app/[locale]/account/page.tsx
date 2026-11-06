"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { api, setToken, type Order, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import { canAccessAdmin } from "@/lib/permissions";

export default function AccountPage() {
  const t = useTranslations("Account");
  const { user, loading, logout, refresh } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    api
      .get<Order[]>("/orders")
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await api.patch<User>("/auth/profile", { name: name.trim() });
      await refresh();
      setMsg(t("profileSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await api.post<{
        ok: boolean;
        accessToken: string;
        user: User;
      }>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      if (res.accessToken) setToken(res.accessToken);
      await refresh();
      setCurrentPassword("");
      setNewPassword("");
      setMsg(t("passwordChanged"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("passwordFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <StoreShell>
        <p className="p-8 text-[var(--gm-muted)]">...</p>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{t("title")}</h1>
            <p className="text-sm text-[var(--gm-muted)]" dir="ltr">
              {user.email}
            </p>
          </div>
          <div className="flex gap-2">
            {canAccessAdmin(user) ? (
              <Link href="/admin" className="gm-btn gm-btn-outline">
                {t("admin")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="gm-btn gm-btn-outline"
            >
              {t("logout")}
            </button>
          </div>
        </div>

        {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={saveProfile}
          className="space-y-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5"
        >
          <h2 className="font-bold text-white">{t("profile")}</h2>
          <label className="block text-xs text-[var(--gm-muted)]">
            {t("name")}
            <input
              className="gm-input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              aria-required
            />
          </label>
          <p className="text-xs text-[var(--gm-muted)]">{t("emailLocked")}</p>
          <button type="submit" disabled={busy} className="gm-btn gm-btn-primary">
            {t("saveProfile")}
          </button>
        </form>

        <form
          onSubmit={changePassword}
          className="space-y-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5"
        >
          <h2 className="font-bold text-white">{t("security")}</h2>
          <p className="text-xs text-[var(--gm-muted)]">{t("passwordHint")}</p>
          <label className="block text-xs text-[var(--gm-muted)]">
            {t("currentPassword")}
            <input
              type="password"
              className="gm-input mt-1"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </label>
          <label className="block text-xs text-[var(--gm-muted)]">
            {t("newPassword")}
            <input
              type="password"
              className="gm-input mt-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" disabled={busy} className="gm-btn gm-btn-outline">
            {t("changePassword")}
          </button>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">{t("orders")}</h2>
            <Link href="/support" className="text-sm text-[var(--gm-violet-400)]">
              {t("needHelp")}
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] p-5 text-[var(--gm-muted)]">
              {t("noOrders")}
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.orderNumber || order.id}`}
                className="block rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 transition hover:border-[var(--gm-violet-700)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm text-white">
                    {order.orderNumber || `#${order.id.slice(-8)}`}
                  </p>
                  <span className="rounded-full bg-[var(--gm-violet-950)] px-3 py-1 text-xs text-[var(--gm-violet-400)]">
                    {order.status}
                    {order.fulfillmentStatus
                      ? ` · ${order.fulfillmentStatus}`
                      : ""}
                  </span>
                </div>
                <p className="mt-2 text-[var(--gm-accent-bright)]">
                  {formatPrice(order.totalEGP)}
                </p>
                {order.isGift ? (
                  <p className="mt-2 text-xs text-[var(--gm-muted)]">
                    {t("giftOrder")}
                  </p>
                ) : null}
              </Link>
            ))
          )}
        </section>
      </div>
    </StoreShell>
  );
}
