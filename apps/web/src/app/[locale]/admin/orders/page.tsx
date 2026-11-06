"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, type Order } from "@/lib/api";
import { formatEGP } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";

type AdminOrder = Order & {
  orderNumber?: string;
  fulfillmentStatus?: string;
  user?: { id: string; email: string; name: string };
};

const STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const canWrite = hasPermission(user, "orders:write");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function load(search = q) {
    const data = await api.get<AdminOrder[]>(
      `/admin/orders?q=${encodeURIComponent(search)}`,
    );
    setOrders(data);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch((e) =>
        setMsg(e instanceof Error ? e.message : "فشل التحميل"),
      );
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function openOrder(id: string) {
    try {
      const order = await api.get<AdminOrder>(`/admin/orders/${id}`);
      setSelected(order);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر فتح الطلب");
    }
  }

  async function changeStatus(id: string, status: string) {
    try {
      const order = await api.patch<AdminOrder>(`/admin/orders/${id}/status`, {
        status,
      });
      setSelected(order);
      setMsg(`تم تحديث الحالة إلى ${status}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل التحديث");
    }
  }

  async function reconcile(id: string) {
    try {
      const result = await api.post<{
        reconciled: boolean;
        reason?: string;
        fulfillmentStatus?: string;
      }>(`/admin/orders/${id}/reconcile-fulfillment`);
      setMsg(
        result.reconciled
          ? `تمت إعادة التسليم (${result.fulfillmentStatus})`
          : result.reason || "لا حاجة لإعادة التسليم",
      );
      await openOrder(id);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل إعادة التسليم");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--gm-muted)]">
          المفاتيح الرقمية لا تُعرض في الجداول العامة. أسرار الدفع محذوفة.
        </p>
      </div>

      <input
        className="gm-input max-w-md"
        placeholder="بحث برقم الطلب / البريد / الاسم"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {msg ? <p className="text-sm text-[var(--gm-accent-bright)]">{msg}</p> : null}

      <div className="overflow-x-auto rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-[var(--gm-surface)] text-[var(--gm-muted)]">
            <tr>
              <th className="px-3 py-3 text-start font-medium">الطلب</th>
              <th className="px-3 py-3 text-start font-medium">العميل</th>
              <th className="px-3 py-3 text-start font-medium">الإجمالي</th>
              <th className="px-3 py-3 text-start font-medium">الدفع</th>
              <th className="px-3 py-3 text-start font-medium">التسليم</th>
              <th className="px-3 py-3 text-start font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer border-t border-[var(--gm-border)] hover:bg-[var(--gm-surface)]"
                onClick={() => openOrder(o.id)}
              >
                <td className="px-3 py-3 font-mono text-xs text-white">
                  {o.orderNumber || `#${o.id.slice(-8)}`}
                </td>
                <td className="px-3 py-3 text-[var(--gm-muted)]">
                  {o.user?.name || "—"}
                  <br />
                  <span className="text-xs">{o.user?.email}</span>
                </td>
                <td className="px-3 py-3 text-white">{formatEGP(o.totalEGP)}</td>
                <td className="px-3 py-3 text-[var(--gm-accent-bright)]">
                  {o.status}
                  {o.payment?.status ? ` / ${o.payment.status}` : ""}
                </td>
                <td className="px-3 py-3">{o.fulfillmentStatus || "—"}</td>
                <td className="px-3 py-3 text-xs text-[var(--gm-muted)]">
                  {new Date(o.createdAt).toLocaleString("ar-EG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--gm-muted)]">
            لا توجد طلبات
          </p>
        ) : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-6 w-full max-w-2xl rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-bg)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {selected.orderNumber || `#${selected.id.slice(-8)}`}
              </h2>
              <button type="button" onClick={() => setSelected(null)}>
                <X className="h-5 w-5 text-[var(--gm-muted)]" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-[var(--gm-muted)]">
              <p>
                العميل:{" "}
                <span className="text-white">
                  {selected.user?.name} ({selected.user?.email})
                </span>
              </p>
              <p>
                الإجمالي:{" "}
                <span className="text-white">{formatEGP(selected.totalEGP)}</span>
              </p>
              <p>
                الدفع:{" "}
                <span className="text-white">
                  {selected.status} / {selected.payment?.status || "—"}
                </span>
              </p>
              <p>
                التسليم:{" "}
                <span className="text-white">
                  {selected.fulfillmentStatus || "—"}
                </span>
              </p>
            </div>

            {canWrite ? (
              <div className="mt-4 space-y-3">
                <label className="text-sm text-[var(--gm-muted)]">
                  تغيير الحالة
                  <select
                    className="gm-input mt-1"
                    value={selected.status}
                    onChange={(e) => changeStatus(selected.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="gm-btn gm-btn-outline"
                  onClick={() => reconcile(selected.id)}
                >
                  إعادة محاولة التسليم (بدون خصم جديد)
                </button>
              </div>
            ) : null}

            <ul className="mt-5 space-y-3">
              {selected.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3"
                >
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-[var(--gm-muted)]">
                    {formatEGP(item.unitPriceEGP)} × {item.quantity}
                  </p>
                  <p className="mt-2 text-xs text-[var(--gm-muted)]">
                    مفتاح:{" "}
                    {item.productKey
                      ? `${item.productKey.status} (مخفي في لوحة الطلبات)`
                      : "غير مُسلَّم"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
