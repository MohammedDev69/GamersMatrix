"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import {
  AdminListState,
  AdminTableSkeleton,
} from "@/components/admin/AdminListState";

type Customer = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  ordersCount: number;
};

export default function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      const soft = items.length > 0;
      if (!soft) setLoading(true);
      api
        .get<{ items: Customer[] }>(
          `/admin/customers?q=${encodeURIComponent(q)}`,
        )
        .then((r) => setItems(r.items))
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-white">العملاء</h1>
        <p className="mt-1 text-sm text-[var(--gm-muted)]">
          بحث ومتابعة حسابات المشترين وطلباتهم
        </p>
      </div>
      <input
        className="gm-input max-w-md"
        placeholder="بحث بالبريد أو الاسم"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <AdminListState
        loading={loading}
        empty={items.length === 0}
        emptyTitle="لا يوجد عملاء"
        emptyDescription="سيظهر العملاء هنا بعد أول تسجيل أو شراء."
        skeleton={<AdminTableSkeleton cols={3} rows={8} />}
      >
        <div className="overflow-x-auto rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]">
          <table className="w-full min-w-[560px] text-start text-sm">
            <thead className="bg-[var(--gm-bg-raised)] text-[var(--gm-muted)]">
              <tr>
                <th className="px-3 py-2">الاسم</th>
                <th className="px-3 py-2">البريد</th>
                <th className="px-3 py-2">طلبات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-[var(--gm-border)]">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="text-white hover:text-[var(--gm-violet-400)]"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2" dir="ltr">
                    {c.email}
                  </td>
                  <td className="px-3 py-2">{c.ordersCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminListState>
    </div>
  );
}
