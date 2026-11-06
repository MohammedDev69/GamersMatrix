"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, type Product } from "@/lib/api";

type AdminProduct = Product & { stock?: number; keysTotal?: number };

type ProductKey = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  orderItem?: { id: string; orderId: string } | null;
};

export default function AdminKeysPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productId, setProductId] = useState("");
  const [codesText, setCodesText] = useState("");
  const [keys, setKeys] = useState<ProductKey[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadProducts() {
    const p = await api.get<AdminProduct[]>("/admin/products");
    setProducts(p);
    if (!productId && p[0]) setProductId(p[0].id);
    return p;
  }

  async function loadKeys(id: string) {
    if (!id) {
      setKeys([]);
      return;
    }
    const list = await api.get<ProductKey[]>(`/admin/products/${id}/keys`);
    setKeys(list);
  }

  useEffect(() => {
    loadProducts().catch((e) => setMsg(e instanceof Error ? e.message : "فشل التحميل"));
  }, []);

  useEffect(() => {
    if (productId) {
      loadKeys(productId).catch(() => setKeys([]));
    }
  }, [productId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const codes = codesText
      .split(/\r?\n|,/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (!codes.length) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await api.post<{ created: number; requested: number }>(
        `/admin/products/${productId}/keys`,
        { codes },
      );
      setMsg(`تمت إضافة ${res.created} من ${res.requested} كود`);
      setCodesText("");
      await loadKeys(productId);
      await loadProducts();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteKey(id: string) {
    if (!confirm("حذف هذا الكود؟")) return;
    try {
      await api.delete(`/admin/keys/${id}`);
      setMsg("تم حذف الكود");
      await loadKeys(productId);
      await loadProducts();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الحذف");
    }
  }

  const selected = products.find((p) => p.id === productId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">الأكواد الرقمية</h1>
        <p className="mt-1 text-sm text-[var(--gm-muted)]">
          رفع ومراجعة وحذف مخزون المفاتيح / الروابط / اليوزرات
        </p>
      </div>

      {msg ? <p className="text-sm text-[var(--gm-accent-bright)]">{msg}</p> : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 md:grid-cols-[1fr_1.2fr]"
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--gm-muted)]">المنتج</span>
            <select
              className="gm-input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (متاح: {p.stock ?? 0})
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <p className="text-xs text-[var(--gm-muted)]">
              المخزون: {selected.stock ?? 0} متاح من أصل {selected.keysTotal ?? 0}
            </p>
          ) : null}
          <textarea
            className="gm-input min-h-40"
            placeholder="ضع كل كود أو رابط أو يوزر في سطر منفصل"
            value={codesText}
            onChange={(e) => setCodesText(e.target.value)}
            required
          />
          <button type="submit" disabled={busy || !productId} className="gm-btn gm-btn-primary">
            {busy ? "جاري الرفع..." : "رفع الأكواد"}
          </button>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">المخزون الحالي</h2>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {keys.length === 0 ? (
              <p className="text-sm text-[var(--gm-muted)]">لا توجد أكواد لهذا المنتج</p>
            ) : (
              keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-start justify-between gap-2 rounded border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs text-white">{k.code}</p>
                    <p className="mt-1 text-[11px] text-[var(--gm-muted)]">
                      {k.status}
                      {k.orderItem ? ` · طلب ${k.orderItem.orderId.slice(-6)}` : ""}
                    </p>
                  </div>
                  {k.status === "AVAILABLE" ? (
                    <button
                      type="button"
                      onClick={() => onDeleteKey(k.id)}
                      className="shrink-0 text-[var(--gm-muted)] hover:text-[var(--gm-danger)]"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
