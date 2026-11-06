"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

type ContentPage = {
  id: string;
  slug: string;
  title: string;
  publicationStatus: string;
  scheduledAt?: string | null;
  scheduleError?: string | null;
  updatedAt: string;
};

const STATUSES = [
  "ALL",
  "DRAFT",
  "IN_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export default function AdminContentListPage() {
  const [items, setItems] = useState<ContentPage[]>([]);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    const q =
      status === "ALL" ? "/admin/content" : `/admin/content?status=${status}`;
    api
      .get<ContentPage[]>(q)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [status]);

  const filtered = useMemo(() => items, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--gm-muted)]">
          مسودة → مراجعة → مجدول → منشور → مؤرشف
        </p>
        <Link href="/admin/content/new" className="gm-btn gm-btn-primary">
          صفحة جديدة
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === s
                ? "bg-white text-black"
                : "bg-white/5 text-[var(--gm-muted)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="overflow-x-auto rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]">
        <table className="w-full min-w-[700px] text-start text-sm">
          <thead className="bg-[var(--gm-bg-raised)] text-[var(--gm-muted)]">
            <tr>
              <th className="px-3 py-2">العنوان</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">الحالة</th>
              <th className="px-3 py-2">تحديث</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((page) => (
              <tr key={page.id} className="border-t border-[var(--gm-border)]">
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/content/${page.id}`}
                    className="font-medium text-white hover:text-[var(--gm-violet-400)]"
                  >
                    {page.title}
                  </Link>
                  {page.scheduleError ? (
                    <p className="text-xs text-rose-400">فشل جدولة</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                  {page.slug}
                </td>
                <td className="px-3 py-2">{page.publicationStatus}</td>
                <td className="px-3 py-2 text-[var(--gm-muted)]">
                  {new Date(page.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="p-4 text-sm text-[var(--gm-muted)]">لا صفحات بعد.</p>
        ) : null}
      </div>
    </div>
  );
}
