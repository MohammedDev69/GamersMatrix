"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CircleCheck,
  CircleX,
  Clock,
  Database,
  KeyRound,
  Package,
  Palette,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { formatEGP } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/admin/StatCard";
import {
  formatRelativeTime,
  orderStatusMetaFor,
} from "@/lib/adminStatus";

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

type Health = {
  status: string;
  db: boolean;
  cache: string;
  uptime: number;
};

const QUICK_ACTIONS = [
  {
    href: "/admin/products",
    label: "إدارة المنتجات",
    icon: Package,
  },
  {
    href: "/admin/keys",
    label: "إضافة أكواد",
    icon: KeyRound,
  },
  {
    href: "/admin/campaigns",
    label: "حملة تخفيض",
    icon: TrendingUp,
  },
  {
    href: "/admin/content/new",
    label: "محتوى جديد",
    icon: Palette,
  },
  {
    href: "/admin/customers",
    label: "العملاء",
    icon: Users,
  },
  {
    href: "/admin/settings",
    label: "الإعدادات",
    icon: Boxes,
  },
] as const;

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [statsData, healthData] = await Promise.allSettled([
        api.get<Stats>("/admin/stats"),
        api.get<Health>("/health"),
      ]);
      if (statsData.status === "fulfilled") setStats(statsData.value);
      else setError(statsData.reason instanceof Error ? statsData.reason.message : "تعذر تحميل الملخص");

      if (healthData.status === "fulfilled") setHealth(healthData.value);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasAlert =
    (stats?.failedFulfillment ?? 0) > 0 || (stats?.failedSchedules ?? 0) > 0;
  const lowStock = stats?.inventoryWarnings?.length ?? 0;

  return (
    <div className="space-y-8">
      {error ? (
        <div
          className="flex items-start gap-2 rounded-[var(--gm-radius-card)] border border-rose-500/35 bg-rose-500/5 p-3 text-sm text-rose-400"
          role="alert"
        >
          <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            className="!px-2 !py-1 text-xs"
            onClick={() => void load(true)}
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : null}

      {/* ===== Hero row: revenue + system health ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[var(--gm-radius-hero)] border border-[var(--gm-border-strong)] bg-[var(--gm-surface-raised)] p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--gm-violet-400)]">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                الإيرادات (طلبات مدفوعة)
              </p>
              <p className="mt-2 text-4xl font-black text-white" dir="rtl">
                {loading ? (
                  <Skeleton className="h-10 w-44" />
                ) : (
                  formatEGP(stats?.revenueEGP)
                )}
              </p>
              <p className="mt-1.5 text-xs text-[var(--gm-text-muted)]">
                عبر {stats?.paidOrders ?? "—"} طلب مدفوع من إجمالي{" "}
                {stats?.orders ?? "—"} طلب
              </p>
            </div>
            <Button
              variant="outline"
              className="!px-3 !py-1.5 text-xs"
              disabled={refreshing || loading}
              onClick={() => void load(true)}
            >
              <RefreshCw
                className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                aria-hidden
              />
              تحديث
            </Button>
          </div>
        </div>

        {/* System health */}
        <div className="rounded-[var(--gm-radius-hero)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--gm-text-muted)]">
            <Database className="h-3.5 w-3.5" aria-hidden />
            حالة النظام
          </p>
          {loading || !health ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={health.db ? "success" : "danger"}>
                قاعدة البيانات {health.db ? "تعمل" : "متوقفة"}
              </Badge>
              <Badge tone={health.cache === "redis" ? "success" : "warning"}>
                الكاش:{" "}
                {health.cache === "redis"
                  ? "Redis"
                  : "ذاكرة احتياطية"}
              </Badge>
              <span
                className="text-xs text-[var(--gm-text-muted)]"
                dir="ltr"
              >
                uptime {Math.floor(health.uptime / 60)}m
              </span>
            </div>
          )}
          {hasAlert || lowStock > 0 ? (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-500/5 px-2.5 py-2 text-xs text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {[
                lowStock > 0 ? `${lowStock} منتج مخزونه منخفض` : null,
                (stats?.failedFulfillment ?? 0) > 0
                  ? `${stats?.failedFulfillment} تسليم فاشل`
                  : null,
                (stats?.failedSchedules ?? 0) > 0
                  ? `${stats?.failedSchedules} جدولة فاشلة`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden />
              لا توجد مشاكل تحتاج انتباهك
            </p>
          )}
        </div>
      </div>

      {/* ===== Quick actions ===== */}
      <section aria-label="إجراءات سريعة">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 py-4 text-center text-xs font-semibold text-[var(--gm-text-secondary)] transition-colors duration-150 hover:border-[var(--gm-border-strong)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]"
            >
              <Icon
                className="h-5 w-5 text-[var(--gm-violet-400)]"
                aria-hidden
              />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Stats grid ===== */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي المنتجات"
          value={
            loading ? <Skeleton className="h-7 w-14" /> : (stats?.products ?? "—")
          }
          href="/admin/products"
        />
        <StatCard
          label="منشور نشط"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              (stats?.activeProducts ?? "—")
            )
          }
          href="/admin/products"
        />
        <StatCard
          label="تصنيفات"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              (stats?.categories ?? "—")
            )
          }
          href="/admin/categories"
        />
        <StatCard
          label="مفاتيح متاحة"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              (stats?.availableKeys ?? "—")
            )
          }
          href="/admin/keys"
          tone={lowStock > 0 ? "warning" : "success"}
          hint={
            lowStock > 0
              ? `${lowStock} منتج ينفد مخزونه`
              : "المخزون بوضع جيد"
          }
        />
        <StatCard
          label="طلبات معلّقة"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              (stats?.pendingOrders ?? "—")
            )
          }
          href="/admin/orders"
          tone={
            (stats?.pendingOrders ?? 0) > 0 ? "warning" : "default"
          }
          hint={
            (stats?.pendingOrders ?? 0) > 0
              ? "بانتظار تأكيد الدفع"
              : undefined
          }
        />
        <StatCard
          label="فشل تسليم"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              (stats?.failedFulfillment ?? "—")
            )
          }
          href="/admin/orders"
          tone={(stats?.failedFulfillment ?? 0) > 0 ? "danger" : "default"}
          hint={
            (stats?.failedFulfillment ?? 0) > 0
              ? "تحقق من تفاصيل الطلبات"
              : undefined
          }
        />
        <StatCard
          label="محتوى معلّق"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              (stats?.pendingContent ?? "—")
            )
          }
          href="/admin/content"
        />
        <StatCard
          label="فشل جدولة"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              (stats?.failedSchedules ?? "—")
            )
          }
          href="/admin/content"
          tone={(stats?.failedSchedules ?? 0) > 0 ? "danger" : "default"}
        />
      </div>

      {/* ===== Latest orders ===== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <ShoppingBag className="h-5 w-5 text-[var(--gm-violet-400)]" aria-hidden />
            أحدث الطلبات
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-[var(--gm-violet-400)] hover:underline"
          >
            عرض الكل
          </Link>
        </div>

        {loading ? (
          <Skeleton className="h-44 w-full" />
        ) : !stats?.latestOrders?.length ? (
          <EmptyState
            title="لا توجد طلبات بعد"
            description="ستظهر الطلبات الجديدة هنا فور إنشائها."
          />
        ) : (
          <div className="overflow-x-auto rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]">
            <table className="w-full min-w-[720px] text-start text-sm">
              <thead className="bg-[var(--gm-bg-raised)] text-[var(--gm-text-muted)]">
                <tr>
                  <th className="px-3 py-2.5 font-medium">الطلب</th>
                  <th className="px-3 py-2.5 font-medium">العميل</th>
                  <th className="px-3 py-2.5 font-medium">الدفع</th>
                  <th className="px-3 py-2.5 font-medium">التسليم</th>
                  <th className="px-3 py-2.5 font-medium">المبلغ</th>
                  <th className="px-3 py-2.5 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {stats.latestOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-[var(--gm-border)] transition-colors hover:bg-[var(--gm-surface-hover)]"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-white">
                      <Link
                        href="/admin/orders"
                        className="hover:text-[var(--gm-violet-400)]"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[var(--gm-text)]">{o.user.name}</div>
                      <div
                        className="truncate text-xs text-[var(--gm-text-muted)]"
                        dir="ltr"
                      >
                        {o.user.email}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={orderStatusMetaFor(o.status).tone}>
                        {orderStatusMetaFor(o.status).label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={orderStatusMetaFor(o.fulfillmentStatus).tone}>
                        {orderStatusMetaFor(o.fulfillmentStatus).label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-white">
                      {formatEGP(o.totalEGP)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-[var(--gm-text-secondary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-[var(--gm-text-muted)]" aria-hidden />
                        {formatRelativeTime(o.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== Inventory warnings ===== */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <AlertTriangle
            className="h-5 w-5 text-amber-400"
            aria-hidden
          />
          تحذيرات المخزون
        </h2>
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : !stats?.inventoryWarnings?.length ? (
          <EmptyState
            title="لا تنبيهات"
            description="لا توجد منتجات بمخزون منخفض حالياً."
          />
        ) : (
          <ul className="space-y-2">
            {stats.inventoryWarnings.map((p) => (
              <li key={p.id}>
                <Link
                  href="/admin/keys"
                  className="flex items-center justify-between gap-3 rounded-[var(--gm-radius-card)] border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm transition-colors hover:bg-amber-500/10"
                >
                  <span className="flex items-center gap-2 text-white">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                    <span className="font-semibold">{p.title}</span>
                    <span className="hidden font-mono text-xs text-[var(--gm-text-muted)] sm:inline" dir="ltr">
                      {p.slug}
                    </span>
                  </span>
                  <Badge tone={p.availableKeys === 0 ? "danger" : "warning"}>
                    {p.availableKeys === 0
                      ? "نفد المخزون"
                      : `${p.availableKeys} متاح`}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Studio shortcut ===== */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/content" className="gm-btn gm-btn-primary">
          استوديو المحتوى
        </Link>
        <Link href="/admin/products" className="gm-btn gm-btn-outline">
          إدارة المنتجات
        </Link>
      </div>
    </div>
  );
}
