"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
import { Reveal } from "@/components/ui/Reveal";
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
  const ar = useLocale() === "ar";
  const locale = useLocale();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories(locale)
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <section className="gm-container pt-8 md:pt-10" aria-label={t("categories")}>
      <SectionHeading title={t("categories")} className="!mb-5" />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-[var(--gm-radius-card)]" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((cat, i) => {
            const Icon = iconFor(cat);
            return (
              <li key={cat.id}>
                <Reveal delayMs={Math.min(i * 45, 360)}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="group flex h-full items-center gap-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(139,61,255,0.5)] hover:bg-[var(--gm-surface-hover)] hover:shadow-[0_8px_30px_rgba(139,61,255,0.12)]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--gm-radius-btn)] bg-[var(--gm-accent-dim)] text-[var(--gm-violet-400)] transition-colors duration-200 group-hover:bg-[var(--gm-violet-600)] group-hover:text-white">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--gm-text)]">
                      {cat.name}
                    </span>
                    <Arrow className="h-4 w-4 shrink-0 text-[var(--gm-violet-400)] opacity-0 transition-all duration-200 group-hover:scale-110 group-hover:opacity-100" aria-hidden />
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
