"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

type Review = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  user: { id: string; name: string };
  product: { id: string; title: string; slug: string };
};

type Summary = { avgRating: number; count: number };

export function RecentReviews() {
  const t = useTranslations("Home");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary>({ avgRating: 0, count: 0 });

  useEffect(() => {
    Promise.all([
      api.get<Review[]>("/reviews/recent?limit=8"),
      api.get<Summary>("/reviews/summary"),
    ])
      .then(([list, sum]) => {
        setReviews(list);
        setSummary(sum);
      })
      .catch(() => {
        setReviews([]);
      });
  }, []);

  if (!reviews.length && !summary.count) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="gm-display text-2xl font-bold text-white md:text-3xl">
              {t("recentReviews")}
            </h2>
            <p className="mt-1 text-[var(--gm-muted)]">{t("reviewsSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-xl font-bold">{summary.avgRating.toFixed(1)}</span>
            <span className="text-sm text-[var(--gm-muted)]">
              · {summary.count.toLocaleString()} reviews
            </span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="min-w-[260px] max-w-[280px] shrink-0 rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4"
            >
              <div className="mb-2 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/20"
                    }`}
                  />
                ))}
              </div>
              <p className="line-clamp-3 text-sm text-[var(--gm-text)]">
                {review.body || review.product.title}
              </p>
              <p className="mt-3 text-xs text-[var(--gm-muted)]">
                {review.user.name} ·{" "}
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
