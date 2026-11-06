"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { formatEGP } from "@/lib/format";

type Stats = {
  products: number;
  activeProducts: number;
  orders: number;
  paidOrders: number;
  pendingOrders?: number;
  failedFulfillment?: number;
  categories: number;
  availableKeys: number;
  revenueEGP: number;
  pendingContent?: number;
  scheduledContent?: number;
  failedSchedules?: number;
  latestOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    fulfillmentStatus: string;
    totalEGP: number;
    createdAt: string;
    user: { name: string; email: string };
  }>;
  inventoryWarnings?: Array<{
    id: string;
    title: string;
    slug: string;
    availableKeys: number;
  }>;
};

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Stats>("/admin/stats")
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  const cards = [
    { label: "المنتجات", value: stats?.products },
    { label: "منشورة نشطة", value: stats?.activeProducts },
    { label: "طلبات مدفوعة", value: stats?.paidOrders },
    { label: "طلبات معلّقة", value: stats?.pendingOrders },
    { label: "فشل تسليم", value: stats?.failedFulfillment },
    { label: "مفاتيح متاحة", value: stats?.availableKeys },
    { label: "محتوى معلّق", value: stats?.pendingContent },
    { label: "مجدول", value: stats?.scheduledContent },
    { label: "فشل جدولة", value: stats?.failedSchedules },
    {
      label: "إيرادات مدفوعة",
      value: stats ? formatEGP(stats.revenueEGP) : undefined,
    },
  ].filter((c) => c.value !== undefined);

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--gm-text-secondary)]">
        ملخص محسوب من البيانات الفعلية — بدون أرقام وهمية.
      </p>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4"
          >
            <p className="text-xs text-[var(--gm-muted)]">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{c.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">أحدث الطلبات</h2>
        {!stats?.latestOrders?.length ? (
          <p className="text-sm text-[var(--gm-muted)]">لا توجد طلبات بعد.</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead className="bg-[var(--gm-bg-raised)] text-[var(--gm-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">الطلب</th>
                  <th className="px-3 py-2 font-medium">العميل</th>
                  <th className="px-3 py-2 font-medium">الدفع</th>
                  <th className="px-3 py-2 font-medium">التسليم</th>
                  <th className="px-3 py-2 font-medium">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {stats.latestOrders.map((o) => (
                  <tr key={o.id} className="border-t border-[var(--gm-border)]">
                    <td className="px-3 py-2 font-mono text-xs text-white">
                      <Link
                        href="/admin/orders"
                        className="hover:text-[var(--gm-violet-400)]"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[var(--gm-text-secondary)]">
                      {o.user.name}
                    </td>
                    <td className="px-3 py-2">{o.status}</td>
                    <td className="px-3 py-2">{o.fulfillmentStatus}</td>
                    <td className="px-3 py-2">{formatEGP(o.totalEGP)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">تحذيرات المخزون</h2>
        {!stats?.inventoryWarnings?.length ? (
          <p className="text-sm text-[var(--gm-muted)]">
            لا توجد منتجات بمخزون منخفض حالياً.
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.inventoryWarnings.map((p) => (
              <li
                key={p.id}
                className="flex justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm"
              >
                <span className="text-white">{p.title}</span>
                <span className="text-amber-300">{p.availableKeys} متاح</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/content" className="gm-btn gm-btn-primary">
          Content Studio
        </Link>
        <Link href="/admin/products" className="gm-btn gm-btn-outline">
          المنتجات
        </Link>
      </div>
    </div>
  );
}
