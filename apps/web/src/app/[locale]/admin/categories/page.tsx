"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { api, type Category } from "@/lib/api";

type AdminCategory = Category & {
  productsCount?: number;
  sortOrder?: number;
  visible?: boolean;
};

type CatForm = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  visible: boolean;
};

const empty: CatForm = {
  name: "",
  slug: "",
  description: "",
  icon: "tag",
  sortOrder: 0,
  visible: true,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CatForm>(empty);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api.get<AdminCategory[]>("/admin/categories");
    setCategories(data);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e instanceof Error ? e.message : "فشل التحميل"));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(c: AdminCategory) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      icon: c.icon || "tag",
      sortOrder: c.sortOrder ?? 0,
      visible: c.visible !== false,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        icon: form.icon || null,
        sortOrder: form.sortOrder,
        visible: form.visible,
      };
      if (editingId) {
        await api.patch(`/admin/categories/${editingId}`, payload);
        setMsg("تم تحديث التصنيف");
      } else {
        await api.post("/admin/categories", payload);
        setMsg("تم إنشاء التصنيف");
      }
      setOpen(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(c: AdminCategory) {
    if (!confirm(`حذف التصنيف «${c.name}»؟`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      setMsg("تم الحذف");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">التصنيفات</h1>
          <p className="mt-1 text-sm text-[var(--gm-muted)]">
            أقسام المتجر والخدمات (ألعاب، نيترو، يوزرات…)
          </p>
        </div>
        <button type="button" onClick={openCreate} className="gm-btn gm-btn-primary">
          <Plus className="h-4 w-4" />
          تصنيف جديد
        </button>
      </div>

      {msg ? <p className="text-sm text-[var(--gm-accent-bright)]">{msg}</p> : null}

      <div className="overflow-x-auto rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[var(--gm-surface)] text-[var(--gm-muted)]">
            <tr>
              <th className="px-3 py-3 text-start font-medium">الاسم</th>
              <th className="px-3 py-3 text-start font-medium">Slug</th>
              <th className="px-3 py-3 text-start font-medium">المنتجات</th>
              <th className="px-3 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-[var(--gm-border)]">
                <td className="px-3 py-3 font-semibold text-white">{c.name}</td>
                <td className="px-3 py-3 text-[var(--gm-muted)]">{c.slug}</td>
                <td className="px-3 py-3 text-[var(--gm-muted)]">{c.productsCount ?? 0}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="rounded border border-[var(--gm-border)] p-1.5 text-[var(--gm-muted)] hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      className="rounded border border-[var(--gm-border)] p-1.5 text-[var(--gm-muted)] hover:text-[var(--gm-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-lg rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-bg)] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "تعديل تصنيف" : "تصنيف جديد"}
              </h2>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-[var(--gm-muted)]" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                className="gm-input"
                placeholder="الاسم"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: editingId ? form.slug : slugify(e.target.value),
                  })
                }
                required
              />
              <input
                className="gm-input"
                placeholder="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
              <input
                className="gm-input"
                placeholder="الأيقونة (اختياري)"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
              <input
                className="gm-input"
                type="number"
                placeholder="ترتيب العرض"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                }
              />
              <label className="flex items-center gap-2 text-sm text-[var(--gm-muted)]">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) =>
                    setForm({ ...form, visible: e.target.checked })
                  }
                />
                ظاهر في التنقل
              </label>
              <textarea
                className="gm-input min-h-24"
                placeholder="الوصف"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={busy} className="gm-btn gm-btn-primary">
                {busy ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="gm-btn gm-btn-outline">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
