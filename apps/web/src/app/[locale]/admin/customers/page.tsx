"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

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

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<{ items: Customer[] }>(
          `/admin/customers?q=${encodeURIComponent(q)}`,
        )
        .then((r) => setItems(r.items))
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-4">
      <input
        className="gm-input max-w-md"
        placeholder="بحث بالبريد أو الاسم"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
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
    </div>
  );
}
