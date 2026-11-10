"use client";

import { useMemo, useState } from "react";
import { ProductCover } from "./ProductCover";
import { getProductImageUrl } from "@/lib/product-image";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  platform?: string;
  imageUrl?: string | null;
  galleryUrls?: Array<string | null | undefined>;
};

export function ProductGallery({ title, platform, imageUrl, galleryUrls = [] }: Props) {
  const images = useMemo(() => {
    const list = [imageUrl, ...galleryUrls]
      .map((u) => getProductImageUrl(u))
      .filter((u): u is string => Boolean(u));
    return Array.from(new Set(list));
  }, [imageUrl, galleryUrls]);

  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--gm-radius-card)] ring-1 ring-[var(--gm-border)] md:aspect-square">
        <ProductCover
          imageUrl={current}
          title={title}
          platform={platform}
          priority
          sizes="(max-width:768px) 100vw, 420px"
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${title} ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative h-16 w-16 overflow-hidden rounded-[10px] ring-1 transition",
                  i === active
                    ? "ring-[var(--gm-violet-500)]"
                    : "ring-[var(--gm-border)] opacity-75 hover:opacity-100",
                )}
              >
                <ProductCover imageUrl={src} title={title} platform={platform} sizes="64px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
