"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { formatEGP } from "@/lib/format";

type CustomerDetail = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    fulfillmentStatus: string;
    totalEGP: number;
    createdAt: string;
  }>;
};

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<CustomerDetail>(`/admin/customers/${id}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [id]);

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!data) return <p className="text-[var(--gm-muted)]">...</p>;

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm text-[var(--gm-violet-400)]">
        ← العملاء
      </Link>
      <div>
        <h2 className="text-xl font-bold text-white">{data.name}</h2>
        <p className="text-sm text-[var(--gm-muted)]" dir="ltr">
          {data.email}
        </p>
      </div>
      <table className="w-full text-start text-sm">
        <thead className="text-[var(--gm-muted)]">
          <tr>
            <th className="py-2">طلب</th>
            <th className="py-2">دفع</th>
            <th className="py-2">تسليم</th>
            <th className="py-2">مبلغ</th>
          </tr>
        </thead>
        <tbody>
          {data.orders.map((o) => (
            <tr key={o.id} className="border-t border-[var(--gm-border)]">
              <td className="py-2 font-mono text-xs">{o.orderNumber}</td>
              <td className="py-2">{o.status}</td>
              <td className="py-2">{o.fulfillmentStatus}</td>
              <td className="py-2">{formatEGP(o.totalEGP)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
