"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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

  useEffect(() => {
    api
      .get<{ items: AuditItem[]; total: number }>(
        `/admin/audit?page=${page}&pageSize=30`,
      )
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [page]);

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <p className="text-sm text-[var(--gm-muted)]">{total} سجل</p>
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
            <p className="mt-1 text-[var(--gm-text-secondary)]">{item.summary}</p>
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
    </div>
  );
}
