"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AdminCardsSkeleton,
  AdminListState,
} from "@/components/admin/AdminListState";

type MediaAsset = {
  id: string;
  url: string;
  alt?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  _count?: { products: number };
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(soft = false) {
    if (!soft) setLoading(true);
    try {
      const data = await api.get<MediaAsset[]>("/admin/media");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (alt.trim()) fd.append("alt", alt.trim());
      await api.post("/admin/media", fd);
      setFile(null);
      setAlt("");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAlt(id: string, value: string) {
    try {
      await api.patch(`/admin/media/${id}`, { alt: value });
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("حذف هذا الملف؟")) return;
    try {
      await api.delete(`/admin/media/${id}`);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete blocked");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">الوسائط</h1>
        <p className="mt-1 text-sm text-[var(--gm-muted)]">
          رفع صور المنتجات وإدارة النصوص البديلة
        </p>
      </div>
      <form
        onSubmit={onUpload}
        className="flex flex-wrap items-end gap-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4"
      >
        <label className="text-xs text-[var(--gm-muted)]">
          ملف صورة
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-1 block text-sm text-white"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <label className="text-xs text-[var(--gm-muted)]">
          Alt
          <input
            className="gm-input mt-1"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy || !file} className="gm-btn gm-btn-primary">
          رفع
        </button>
      </form>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <AdminListState
        loading={loading}
        empty={items.length === 0}
        emptyTitle="لا توجد ملفات"
        emptyDescription="ارفع صورة من النموذج أعلاه للبدء."
        skeleton={<AdminCardsSkeleton count={6} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt || ""}
                className="mb-2 h-36 w-full rounded object-cover"
              />
              <p className="truncate text-xs text-[var(--gm-muted)]" dir="ltr">
                {m.mimeType} · {m.sizeBytes ?? 0}b · linked{" "}
                {m._count?.products ?? 0}
              </p>
              <input
                className="gm-input mt-2"
                defaultValue={m.alt || ""}
                placeholder="Alt text"
                onBlur={(e) => {
                  if (e.target.value !== (m.alt || "")) {
                    saveAlt(m.id, e.target.value);
                  }
                }}
              />
              <button
                type="button"
                className="mt-2 text-sm text-rose-400"
                onClick={() => remove(m.id)}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </AdminListState>
    </div>
  );
}
