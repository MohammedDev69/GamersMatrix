"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AdminListState,
  AdminCardsSkeleton,
} from "@/components/admin/AdminListState";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number | string;
  active: boolean;
  maxRedemptions?: number | null;
  redemptionCount: number;
  minOrderEGP?: number | string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

type Campaign = {
  id: string;
  name: string;
  slug: string;
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
  priority: number;
  coupons: Coupon[];
};

export default function AdminCampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [couponType, setCouponType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("10");
  const [campaignId, setCampaignId] = useState("");

  async function load(soft = false) {
    if (!soft) setLoading(true);
    try {
      const data = await api.get<Campaign[]>("/admin/campaigns");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/admin/campaigns", {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
      });
      setName("");
      setSlug("");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function createCoupon(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/admin/coupons", {
        code: code.trim().toUpperCase(),
        type: couponType,
        value: Number(value),
        campaignId: campaignId || undefined,
      });
      setCode("");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api.patch(`/admin/campaigns/${id}`, { status });
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">الحملات والكوبونات</h1>
        <p className="mt-1 text-sm text-[var(--gm-muted)]">
          إدارة الخصومات والعروض الترويجية
        </p>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <form
        onSubmit={createCampaign}
        className="grid gap-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 md:grid-cols-3"
      >
        <input
          className="gm-input"
          placeholder="اسم الحملة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="gm-input"
          placeholder="slug"
          dir="ltr"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <button type="submit" className="gm-btn gm-btn-primary">
          إنشاء حملة
        </button>
      </form>

      <form
        onSubmit={createCoupon}
        className="grid gap-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 md:grid-cols-5"
      >
        <input
          className="gm-input"
          placeholder="CODE"
          dir="ltr"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <select
          className="gm-input"
          value={couponType}
          onChange={(e) => setCouponType(e.target.value as "PERCENT" | "FIXED")}
        >
          <option value="PERCENT">PERCENT</option>
          <option value="FIXED">FIXED</option>
        </select>
        <input
          className="gm-input"
          type="number"
          min={0.01}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
        <select
          className="gm-input"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
        >
          <option value="">بدون حملة</option>
          {items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="gm-btn gm-btn-outline">
          إنشاء كوبون
        </button>
      </form>

      <AdminListState
        loading={loading}
        empty={items.length === 0}
        emptyTitle="لا توجد حملات بعد"
        emptyDescription="أنشئ حملة من النموذج أعلاه ثم أضف كوبونات لها."
        skeleton={<AdminCardsSkeleton count={3} className="!grid-cols-1" />}
      >
        <div className="space-y-4">
          {items.map((c) => (
            <div
              key={c.id}
              className="rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-white">{c.name}</h2>
                  <p className="text-xs text-[var(--gm-muted)]" dir="ltr">
                    {c.slug} · {c.status} · priority {c.priority}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"].map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        className="gm-btn gm-btn-outline !px-2 !py-1 !text-xs"
                        onClick={() => setStatus(c.id, s)}
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-[var(--gm-text-secondary)]">
                {c.coupons.map((coupon) => (
                  <li key={coupon.id} dir="ltr">
                    {coupon.code} · {coupon.type} {String(coupon.value)} ·{" "}
                    {coupon.redemptionCount}
                    {coupon.maxRedemptions != null
                      ? `/${coupon.maxRedemptions}`
                      : ""}{" "}
                    · {coupon.active ? "active" : "off"}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AdminListState>
    </div>
  );
}
