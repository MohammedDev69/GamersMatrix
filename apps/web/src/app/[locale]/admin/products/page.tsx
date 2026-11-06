"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api, type Category, type Product, type ProductKind } from "@/lib/api";
import { formatEGP } from "@/lib/format";

type AdminProduct = Product & {
  stock?: number;
  keysTotal?: number;
  category?: Category;
  publicationStatus?: string;
  scheduleError?: string | null;
};

type ProductForm = {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  platform: string;
  priceEGP: number;
  originalPrice: number | "";
  discountPct: number | "";
  featured: boolean;
  weeklyDeal: boolean;
  active: boolean;
  kind: ProductKind;
  deliveryNote: string;
  categoryId: string;
  soldCount: number;
};

const emptyForm = (categoryId = ""): ProductForm => ({
  title: "",
  slug: "",
  description: "",
  imageUrl:
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop",
  platform: "PlayStation 5",
  priceEGP: 100,
  originalPrice: "",
  discountPct: "",
  featured: false,
  weeklyDeal: false,
  active: true,
  kind: "GAME_KEY",
  deliveryNote: "",
  categoryId,
  soldCount: 0,
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]/gi, "");
}

function toForm(p: AdminProduct): ProductForm {
  return {
    title: p.title,
    slug: p.slug,
    description: p.description,
    imageUrl: p.imageUrl,
    platform: p.platform,
    priceEGP: p.priceEGP,
    originalPrice: p.originalPrice ?? "",
    discountPct: p.discountPct ?? "",
    featured: p.featured,
    weeklyDeal: p.weeklyDeal,
    active: p.active,
    kind: p.kind || "GAME_KEY",
    deliveryNote: p.deliveryNote || "",
    categoryId: p.categoryId,
    soldCount: p.soldCount ?? 0,
  };
}

function toPayload(form: ProductForm) {
  return {
    title: form.title,
    slug: form.slug,
    description: form.description,
    imageUrl: form.imageUrl,
    platform: form.platform,
    priceEGP: Number(form.priceEGP),
    originalPrice:
      form.originalPrice === "" ? null : Number(form.originalPrice),
    discountPct: form.discountPct === "" ? null : Number(form.discountPct),
    featured: form.featured,
    weeklyDeal: form.weeklyDeal,
    active: form.active,
    kind: form.kind,
    deliveryNote: form.deliveryNote || null,
    categoryId: form.categoryId,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm());

  async function load() {
    const [p, c] = await Promise.all([
      api.get<{ items: AdminProduct[]; total: number } | AdminProduct[]>(
        `/admin/products?page=${page}&pageSize=20&q=${encodeURIComponent(query)}&status=${encodeURIComponent(statusFilter)}`,
      ),
      api.get<Category[]>("/admin/categories"),
    ]);
    if (Array.isArray(p)) {
      setProducts(p);
      setTotal(p.length);
    } else {
      setProducts(p.items);
      setTotal(p.total);
    }
    setCategories(c);
    return c;
  }

  useEffect(() => {
    load().catch((e) => setMsg(e instanceof Error ? e.message : "فشل التحميل"));
  }, [page, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load().catch((e) => setMsg(e instanceof Error ? e.message : "فشل التحميل"));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q),
    );
  }, [products, query]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(categories[0]?.id || ""));
    setOpen(true);
    setMsg("");
  }

  function openEdit(p: AdminProduct) {
    setEditingId(p.id);
    setForm(toForm(p));
    setOpen(true);
    setMsg("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const payload = toPayload(form);
      if (editingId) {
        await api.patch(`/admin/products/${editingId}`, payload);
        setMsg("تم تحديث المنتج");
      } else {
        await api.post("/admin/products", payload);
        setMsg("تم إنشاء المنتج");
      }
      setOpen(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string, title: string) {
    if (!confirm(`حذف المنتج «${title}»؟ لا يمكن التراجع.`)) return;
    setBusy(true);
    try {
      await api.delete(`/admin/products/${id}`);
      setMsg("تم حذف المنتج");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الحذف");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(p: AdminProduct) {
    try {
      await api.patch(`/admin/products/${p.id}`, { active: !p.active });
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل التحديث");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">المنتجات</h1>
          <p className="mt-1 text-sm text-[var(--gm-muted)]">
            إضافة وتعديل وحذف المنتجات والأسعار والصور
          </p>
        </div>
        <button type="button" onClick={openCreate} className="gm-btn gm-btn-primary">
          <Plus className="h-4 w-4" />
          منتج جديد
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--gm-muted)]" />
          <input
            className="gm-input pr-9"
            placeholder="بحث بالاسم أو المنصة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="gm-input w-auto"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">كل حالات النشر</option>
          {[
            "DRAFT",
            "IN_REVIEW",
            "SCHEDULED",
            "PUBLISHED",
            "ARCHIVED",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--gm-muted)]">{total} منتج</p>
      </div>

      {msg ? <p className="text-sm text-[var(--gm-accent-bright)]">{msg}</p> : null}

      <div className="overflow-x-auto rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[var(--gm-surface)] text-[var(--gm-muted)]">
            <tr>
              <th className="px-3 py-3 text-start font-medium">المنتج</th>
              <th className="px-3 py-3 text-start font-medium">النوع</th>
              <th className="px-3 py-3 text-start font-medium">السعر</th>
              <th className="px-3 py-3 text-start font-medium">المخزون</th>
              <th className="px-3 py-3 text-start font-medium">الحالة</th>
              <th className="px-3 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-[var(--gm-border)]">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-[var(--gm-surface)]">
                      <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="36px" />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{p.title}</p>
                      <p className="text-xs text-[var(--gm-muted)]">
                        {p.platform} · {p.category?.name || p.categoryId}
                        {p.publicationStatus
                          ? ` · ${p.publicationStatus}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-[var(--gm-muted)]">{p.kind || "GAME_KEY"}</td>
                <td className="px-3 py-3 text-white">{formatEGP(p.priceEGP)}</td>
                <td className="px-3 py-3 text-[var(--gm-muted)]">
                  {p.stock ?? 0}/{p.keysTotal ?? 0}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.active
                        ? "bg-[rgba(74,222,128,0.15)] text-[var(--gm-success)]"
                        : "bg-[rgba(248,113,113,0.15)] text-[var(--gm-danger)]"
                    }`}
                  >
                    {p.active ? "نشط" : "متوقف"}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded border border-[var(--gm-border)] p-1.5 text-[var(--gm-muted)] hover:text-white"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(p.id, p.title)}
                      className="rounded border border-[var(--gm-border)] p-1.5 text-[var(--gm-muted)] hover:text-[var(--gm-danger)]"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--gm-muted)]">لا توجد منتجات</p>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <form
            onSubmit={onSubmit}
            className="my-6 w-full max-w-3xl rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-bg)] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "تعديل منتج" : "منتج جديد"}
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق">
                <X className="h-5 w-5 text-[var(--gm-muted)]" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">العنوان</span>
                <input
                  className="gm-input"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: editingId ? form.slug : slugify(e.target.value),
                    })
                  }
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">Slug</span>
                <input
                  className="gm-input"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-[var(--gm-muted)]">الوصف</span>
                <textarea
                  className="gm-input min-h-24"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-[var(--gm-muted)]">رابط الصورة</span>
                <input
                  className="gm-input"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  required
                />
                {form.imageUrl ? (
                  <span className="relative mt-2 block h-40 w-28 overflow-hidden rounded border border-[var(--gm-border)]">
                    <Image src={form.imageUrl} alt="" fill className="object-cover" sizes="112px" />
                  </span>
                ) : null}
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">المنصة</span>
                <input
                  className="gm-input"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">التصنيف</span>
                <select
                  className="gm-input"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">النوع</span>
                <select
                  className="gm-input"
                  value={form.kind}
                  onChange={(e) =>
                    setForm({ ...form, kind: e.target.value as ProductKind })
                  }
                >
                  <option value="GAME_KEY">مفتاح لعبة</option>
                  <option value="GIFT_CARD">بطاقة شحن</option>
                  <option value="SERVICE">خدمة</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">السعر (ج.م)</span>
                <input
                  className="gm-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.priceEGP}
                  onChange={(e) => setForm({ ...form, priceEGP: Number(e.target.value) })}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">السعر قبل الخصم</span>
                <input
                  className="gm-input"
                  type="number"
                  min={0}
                  value={form.originalPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      originalPrice: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[var(--gm-muted)]">نسبة الخصم %</span>
                <input
                  className="gm-input"
                  type="number"
                  min={0}
                  max={100}
                  value={form.discountPct}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountPct: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-[var(--gm-muted)]">ملاحظة التسليم (للخدمات)</span>
                <textarea
                  className="gm-input min-h-20"
                  value={form.deliveryNote}
                  onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })}
                  placeholder="كيف يستخدم العميل الخدمة بعد الدفع"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--gm-muted)]">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                مميز في الرئيسية
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--gm-muted)]">
                <input
                  type="checkbox"
                  checked={form.weeklyDeal}
                  onChange={(e) => setForm({ ...form, weeklyDeal: e.target.checked })}
                />
                عرض أسبوعي
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--gm-muted)]">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                نشط وظاهر في المتجر
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className="gm-btn gm-btn-primary">
                {busy ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إنشاء المنتج"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="gm-btn gm-btn-outline"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
