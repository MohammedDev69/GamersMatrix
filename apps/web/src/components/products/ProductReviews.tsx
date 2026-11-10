"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  user: { id: string; name: string };
};

type ReviewsPayload = {
  productId: string;
  avgRating: number;
  count: number;
  reviews: ReviewRow[];
};

export function ProductReviews({ productId }: { productId: string }) {
  const t = useTranslations("Product");
  const { user } = useAuth();
  const [data, setData] = useState<ReviewsPayload | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);

  // Lazy loading: the reviews section sits below the fold, so the fetch
  // starts only when the visitor scrolls close to it.
  useEffect(() => {
    if (nearViewport) return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearViewport]);

  useEffect(() => {
    if (!nearViewport) return;
    let cancelled = false;
    api
      .get<ReviewsPayload>(`/reviews/product/${productId}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) {
          setData({ productId, avgRating: 0, count: 0, reviews: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, nearViewport]);

  async function load() {
    const res = await api.get<ReviewsPayload>(`/reviews/product/${productId}`);
    setData(res);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setMsg("");
    try {
      await api.post("/reviews", { productId, rating, body: body.trim() || undefined });
      setBody("");
      setRating(5);
      await load();
      setMsg("OK");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      ref={sectionRef}
      className="mt-10 space-y-4 border-t border-[var(--gm-border)] pt-8"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">{t("reviews")}</h2>
        {data && data.count > 0 ? (
          <div className="flex items-center gap-1 text-sm text-[var(--gm-muted)]">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {data.avgRating.toFixed(1)} · {data.count}
          </div>
        ) : null}
      </div>

      {user ? (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 space-y-3"
        >
          <p className="text-sm font-medium text-white">{t("writeReview")}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n}`}
              >
                <Star
                  className={`h-5 w-5 ${
                    n <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-white/25"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            className="gm-input min-h-20"
            placeholder={t("reviewBody")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button type="submit" disabled={busy} className="gm-btn gm-btn-primary">
            {t("submitReview")}
          </button>
          {msg && msg !== "OK" ? (
            <p className="text-sm text-rose-400">{msg}</p>
          ) : null}
        </form>
      ) : (
        <p className="text-sm text-[var(--gm-muted)]">
          <Link href="/login" className="text-[var(--gm-accent-bright)] underline">
            {t("loginToReview")}
          </Link>
        </p>
      )}

      <ul className="space-y-3">
        {data?.reviews?.length ? (
          data.reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-[var(--gm-border)] p-3"
            >
              <div className="mb-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/20"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-white">{review.body || "—"}</p>
              <p className="mt-1 text-xs text-[var(--gm-muted)]">
                {review.user.name} ·{" "}
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))
        ) : (
          <p className="text-sm text-[var(--gm-muted)]">{t("noReviews")}</p>
        )}
      </ul>
    </section>
  );
}
