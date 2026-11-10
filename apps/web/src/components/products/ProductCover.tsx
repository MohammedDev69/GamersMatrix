"use client";

import Image from "next/image";
import { useState } from "react";
import { Gamepad2 } from "lucide-react";
import { getProductImageUrl } from "@/lib/product-image";
import { cn } from "@/lib/cn";

type Props = {
  imageUrl?: string | null;
  title: string;
  platform?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
};

export function ProductCover({
  imageUrl,
  title,
  platform,
  className,
  sizes = "(max-width:768px) 45vw, 240px",
  priority = false,
  fill = true,
}: Props) {
  const resolved = getProductImageUrl(imageUrl);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(resolved) && !failed;

  if (!showImage) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(160deg,#251743_0%,#100a1c_55%,#090610_100%)] text-[var(--gm-violet-300)]",
          className,
        )}
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,61,255,0.35),transparent_55%)]" />
        <Gamepad2 className="relative h-10 w-10 opacity-80" strokeWidth={1.5} />
        {platform ? (
          <span dir="ltr" className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gm-violet-400)]">
            {platform}
          </span>
        ) : null}
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  return (
    <Image
      src={resolved!}
      alt={title}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
