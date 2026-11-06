"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";

type ContentPage = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  body: string;
  bodyEn?: string | null;
  locale?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  internalNotes?: string | null;
  publicationStatus: string;
  scheduledAt?: string | null;
  scheduleError?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
};

type Revision = {
  id: string;
  note?: string | null;
  createdAt: string;
  editor?: { name: string; email: string } | null;
};

type SaveState = "idle" | "saving" | "saved" | "failed";

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"],
  IN_REVIEW: ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"],
  SCHEDULED: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["DRAFT"],
};

export default function ContentStudioEditorPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { user } = useAuth();
  const canPublish = hasPermission(user, "content:publish");

  const [page, setPage] = useState<ContentPage | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    titleEn: "",
    body: "",
    bodyEn: "",
    locale: "ar",
    seoTitle: "",
    seoDescription: "",
    ogImageUrl: "",
    internalNotes: "",
  });
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [scheduledAt, setScheduledAt] = useState("");
  const [slugOk, setSlugOk] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [timezone, setTimezone] = useState("Africa/Cairo");

  const load = useCallback(async () => {
    const [data, revs] = await Promise.all([
      api.get<ContentPage>(`/admin/content/${id}`),
      api.get<Revision[]>(`/admin/content/${id}/revisions`),
    ]);
    setPage(data);
    setRevisions(revs);
    setForm({
      slug: data.slug,
      title: data.title,
      titleEn: data.titleEn || "",
      body: data.body,
      bodyEn: data.bodyEn || "",
      locale: data.locale || "ar",
      seoTitle: data.seoTitle || "",
      seoDescription: data.seoDescription || "",
      ogImageUrl: data.ogImageUrl || "",
      internalNotes: data.internalNotes || "",
    });
    setScheduledAt(
      data.scheduledAt
        ? new Date(data.scheduledAt).toISOString().slice(0, 16)
        : "",
    );
    setDirty(false);
    setSaveState("idle");
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
    api
      .get<{ timezone?: string }>("/admin/settings")
      .then((s) => {
        if (s.timezone) setTimezone(s.timezone);
      })
      .catch(() => undefined);
  }, [load]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!form.slug.trim()) {
      setSlugOk(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<{ available: boolean }>(
          `/admin/content/slug-available?slug=${encodeURIComponent(form.slug)}&excludeId=${id}`,
        )
        .then((r) => setSlugOk(r.available))
        .catch(() => setSlugOk(null));
    }, 300);
    return () => clearTimeout(t);
  }, [form.slug, id]);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setSaveState("idle");
  }

  async function save() {
    setSaveState("saving");
    setError("");
    try {
      const updated = await api.patch<ContentPage>(`/admin/content/${id}`, {
        ...form,
        slug: form.slug.trim().toLowerCase(),
      });
      setPage(updated);
      setDirty(false);
      setSaveState("saved");
      const revs = await api.get<Revision[]>(`/admin/content/${id}/revisions`);
      setRevisions(revs);
    } catch (e) {
      setSaveState("failed");
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await save();
  }

  async function transition(status: string) {
    if (
      (status === "PUBLISHED" || status === "ARCHIVED") &&
      !window.confirm(`تأكيد التحويل إلى ${status}؟ سيؤثر على الصفحات العامة.`)
    ) {
      return;
    }
    if (dirty) await save();
    setError("");
    try {
      const updated = await api.post<ContentPage>(
        `/admin/content/${id}/publication`,
        {
          status,
          scheduledAt:
            status === "SCHEDULED"
              ? new Date(scheduledAt).toISOString()
              : undefined,
        },
      );
      setPage(updated);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transition failed");
    }
  }

  async function retrySchedule() {
    try {
      await api.post(`/admin/publishing/content/${id}/retry-schedule`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Retry failed");
    }
  }

  async function restore(revisionId: string) {
    if (!window.confirm("استعادة هذه المراجعة؟ لن تُغيّر حالة النشر.")) return;
    try {
      await api.post(
        `/admin/content/${id}/revisions/${revisionId}/restore`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
    }
  }

  const nextStatuses = useMemo(
    () => (page ? TRANSITIONS[page.publicationStatus] || [] : []),
    [page],
  );

  const saveLabel =
    saveState === "saving"
      ? "جاري الحفظ…"
      : saveState === "saved"
        ? "تم الحفظ"
        : saveState === "failed"
          ? "فشل الحفظ"
          : dirty
            ? "غير محفوظ"
            : "محفوظ";

  if (!page) {
    return <p className="text-[var(--gm-muted)]">{error || "..."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/content"
            className="text-sm text-[var(--gm-violet-400)]"
          >
            ← القائمة
          </Link>
          <p className="mt-1 text-sm text-[var(--gm-muted)]">
            الحالة: <strong className="text-white">{page.publicationStatus}</strong>
            {" · "}
            {saveLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="gm-btn gm-btn-outline"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "إخفاء المعاينة" : "معاينة"}
          </button>
          <button
            type="button"
            className="gm-btn gm-btn-primary"
            onClick={() => save()}
            disabled={saveState === "saving"}
          >
            حفظ يدوي
          </button>
        </div>
      </div>

      {page.scheduleError ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm">
          <p className="text-rose-300">فشل الجدولة: {page.scheduleError}</p>
          {canPublish ? (
            <button
              type="button"
              className="gm-btn gm-btn-outline mt-2"
              onClick={retrySchedule}
            >
              إعادة محاولة النشر المجدول
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-xs text-[var(--gm-muted)]">
            العنوان
            <input
              className="gm-input mt-1"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </label>
          <label className="block text-xs text-[var(--gm-muted)]">
            Title (EN)
            <input
              className="gm-input mt-1"
              dir="ltr"
              value={form.titleEn}
              onChange={(e) => setField("titleEn", e.target.value)}
            />
          </label>
          <label className="block text-xs text-[var(--gm-muted)]">
            Slug{" "}
            {slugOk === false ? (
              <span className="text-rose-400">مستخدم</span>
            ) : slugOk ? (
              <span className="text-emerald-400">متاح</span>
            ) : null}
            <input
              className="gm-input mt-1"
              dir="ltr"
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              required
            />
          </label>
          <label className="block text-xs text-[var(--gm-muted)]">
            المحتوى
            <textarea
              className="gm-input mt-1 min-h-48"
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
              required
            />
          </label>
          <label className="block text-xs text-[var(--gm-muted)]">
            Body (EN)
            <textarea
              className="gm-input mt-1 min-h-28"
              dir="ltr"
              value={form.bodyEn}
              onChange={(e) => setField("bodyEn", e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-[var(--gm-muted)]">
              Locale
              <input
                className="gm-input mt-1"
                dir="ltr"
                value={form.locale}
                onChange={(e) => setField("locale", e.target.value)}
              />
            </label>
            <label className="block text-xs text-[var(--gm-muted)]">
              SEO title
              <input
                className="gm-input mt-1"
                value={form.seoTitle}
                onChange={(e) => setField("seoTitle", e.target.value)}
              />
            </label>
          </div>
          <label className="block text-xs text-[var(--gm-muted)]">
            SEO description
            <textarea
              className="gm-input mt-1"
              value={form.seoDescription}
              onChange={(e) => setField("seoDescription", e.target.value)}
            />
          </label>
          <label className="block text-xs text-[var(--gm-muted)]">
            Social / OG image URL
            <input
              className="gm-input mt-1"
              dir="ltr"
              value={form.ogImageUrl}
              onChange={(e) => setField("ogImageUrl", e.target.value)}
            />
          </label>
          <label className="block text-xs text-[var(--gm-muted)]">
            ملاحظات داخلية
            <textarea
              className="gm-input mt-1"
              value={form.internalNotes}
              onChange={(e) => setField("internalNotes", e.target.value)}
            />
          </label>
        </form>

        <aside className="space-y-4">
          {canPublish ? (
            <div className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 space-y-3">
              <h3 className="font-semibold text-white">النشر</h3>
              <p className="text-xs text-[var(--gm-muted)]">
                المنطقة الزمنية: {timezone}
              </p>
              <label className="block text-xs text-[var(--gm-muted)]">
                موعد الجدولة
                <input
                  type="datetime-local"
                  className="gm-input mt-1"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="gm-btn gm-btn-outline !text-xs"
                    onClick={() => transition(s)}
                  >
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--gm-muted)]">
              ليس لديك صلاحية النشر. يمكنك حفظ المسودة فقط.
            </p>
          )}

          <div className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4">
            <h3 className="mb-2 font-semibold text-white">سجل المراجعات</h3>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
              {revisions.map((r) => (
                <li
                  key={r.id}
                  className="rounded border border-[var(--gm-border)] p-2"
                >
                  <p className="text-white">{r.note || "Revision"}</p>
                  <p className="text-[var(--gm-muted)]">
                    {r.editor?.name || "system"} ·{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-[var(--gm-violet-400)]"
                    onClick={() => restore(r.id)}
                  >
                    استعادة المحتوى
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {showPreview ? (
        <section className="rounded-[var(--gm-radius-card)] border border-dashed border-[var(--gm-border-strong)] bg-[var(--gm-bg-raised)] p-6">
          <p className="mb-3 text-xs uppercase tracking-wide text-[var(--gm-violet-400)]">
            معاينة عامة (بدون نشر)
          </p>
          <article>
            <h2 className="gm-display text-3xl font-extrabold text-white">
              {form.title}
            </h2>
            {form.seoDescription ? (
              <p className="mt-2 text-sm text-[var(--gm-muted)]">
                {form.seoDescription}
              </p>
            ) : null}
            <div className="prose prose-invert mt-6 max-w-none whitespace-pre-wrap text-[var(--gm-text-secondary)]">
              {form.body}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
