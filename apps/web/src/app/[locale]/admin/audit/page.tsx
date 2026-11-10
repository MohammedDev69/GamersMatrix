"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AdminCardsSkeleton,
  AdminListState,
} from "@/components/admin/AdminListState";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  createdAt: string;
  actor?: { name: string; email: string; role: string } | null;
  metadata?: Record<string, unknown> | null;
};

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const soft = items.length > 0;
    if (!soft) setLoading(true);
    api
      .get<{ items: AuditItem[]; total: number }>(
        `/admin/audit?page=${page}&pageSize=30`,
      )
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-white">سجل التدقيق</h1>
        <p className="mt-1 text-sm text-[var(--gm-muted)]">
          {loading ? "جاري التحميل…" : `${total} سجل`}
        </p>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <AdminListState
        loading={loading}
        empty={items.length === 0}
        emptyTitle="لا توجد سجلات بعد"
        emptyDescription="ستظهر هنا إجراءات المشرفين تلقائياً."
        skeleton={<AdminCardsSkeleton count={5} className="!grid-cols-1" />}
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3 text-sm"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-white">{item.action}</strong>
                <span className="text-xs text-[var(--gm-muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[var(--gm-text-secondary)]">
                {item.summary}
              </p>
              <p className="mt-1 text-xs text-[var(--gm-muted)]">
                {item.actor?.name || "system"} · {item.entityType}
                {item.entityId ? ` · ${item.entityId}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            className="gm-btn gm-btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </button>
          <button
            type="button"
            className="gm-btn gm-btn-outline"
            disabled={page * 30 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </button>
        </div>
      </AdminListState>
    </div>
  );
}
