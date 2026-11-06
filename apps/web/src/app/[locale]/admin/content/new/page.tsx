"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

export default function NewContentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const page = await api.post<{ id: string }>("/admin/content", {
        title: title.trim(),
        slug: slug.trim().toLowerCase() || title.trim().toLowerCase().replace(/\s+/g, "-"),
        body: body.trim() || "…",
        locale: "ar",
      });
      router.push(`/admin/content/${page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-bold text-white">إنشاء مسودة</h2>
      <input
        className="gm-input"
        placeholder="العنوان"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="gm-input"
        placeholder="slug"
        dir="ltr"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />
      <textarea
        className="gm-input min-h-32"
        placeholder="المحتوى"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <button type="submit" disabled={busy} className="gm-btn gm-btn-primary">
        {busy ? "..." : "إنشاء وفتح المحرر"}
      </button>
    </form>
  );
}
