"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Gamepad2,
  Sparkles,
  Tag,
  Wrench,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/api";
import { listCategories } from "@/lib/catalog/repository";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";

const ICON_MAP: Record<string, typeof Gamepad2> = {
  gamepad: Gamepad2,
  gift: CreditCard,
  zap: Zap,
  tag: Tag,
  wrench: Wrench,
  default: Sparkles,
};

function iconFor(cat: Category) {
  if (cat.icon && ICON_MAP[cat.icon]) return ICON_MAP[cat.icon];
  if (cat.slug.includes("gift")) return CreditCard;
  if (cat.slug.includes("top")) return Zap;
  if (cat.slug.includes("offer")) return Tag;
  if (cat.slug.includes("service")) return Wrench;
  return Gamepad2;
}

export function CategoryStrip() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories(locale)
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locale]);

  return (
    <section className="gm-container pt-6 md:pt-8" aria-label={t("categories")}>
      <SectionHeading title={t("categories")} className="!mb-4" />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-[var(--gm-radius-card)]" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((cat) => {
            const Icon = iconFor(cat);
            return (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="group flex items-center gap-2.5 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3.5 py-3 transition-colors duration-150 hover:border-[var(--gm-border-strong)] hover:bg-[var(--gm-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gm-violet-500)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--gm-radius-sm)] bg-[var(--gm-accent-dim)] text-[var(--gm-violet-400)]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-[var(--gm-text)]">
                    {cat.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
