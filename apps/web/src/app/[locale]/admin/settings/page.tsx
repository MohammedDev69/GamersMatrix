"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Settings = {
  storeName: string;
  defaultLocale: string;
  currencyCode: string;
  timezone: string;
  supportWhatsApp?: string | null;
  supportEmail?: string | null;
  publicNotice?: string | null;
  seoTitleDefault?: string | null;
  seoDescriptionDefault?: string | null;
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Settings>("/admin/settings")
      .then(setForm)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMsg("");
    setError("");
    try {
      const saved = await api.patch<Settings>("/admin/settings", form);
      setForm(saved);
      setMsg("تم الحفظ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  if (!form) return <p className="text-[var(--gm-muted)]">{error || "..."}</p>;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-3">
      <p className="text-sm text-[var(--gm-muted)]">
        أسرار الدفع والبريد تُدار عبر متغيرات البيئة فقط ولا تُعرض هنا.
      </p>
      {(
        [
          ["storeName", "اسم المتجر"],
          ["defaultLocale", "اللغة الافتراضية"],
          ["currencyCode", "العملة"],
          ["timezone", "المنطقة الزمنية"],
          ["supportWhatsApp", "واتساب الدعم"],
          ["supportEmail", "بريد الدعم"],
          ["seoTitleDefault", "SEO title افتراضي"],
          ["seoDescriptionDefault", "SEO description افتراضي"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block text-xs text-[var(--gm-muted)]">
          {label}
          <input
            className="gm-input mt-1"
            value={String(form[key] ?? "")}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}
      <label className="block text-xs text-[var(--gm-muted)]">
        ملاحظة عامة للعملاء (ساعات/كيان — اختياري)
        <textarea
          className="gm-input mt-1 min-h-24"
          value={form.publicNotice ?? ""}
          onChange={(e) => setForm({ ...form, publicNotice: e.target.value })}
        />
      </label>
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <button type="submit" className="gm-btn gm-btn-primary">
        حفظ الإعدادات
      </button>
    </form>
  );
}
