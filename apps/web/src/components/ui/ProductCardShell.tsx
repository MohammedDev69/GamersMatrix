import { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

export type ProductCardShellProps = {
  artwork: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  price: ReactNode;
  action?: ReactNode;
  badges?: ReactNode;
  loading?: boolean;
  className?: string;
  href?: string;
  asLink?: ReactNode;
};

/** Presentational product card frame — wiring stays with ProductCard. */
export function ProductCardShell({
  artwork,
  title,
  meta,
  price,
  action,
  badges,
  loading = false,
  className,
}: ProductCardShellProps) {
  if (loading) {
    return (
      <div className={cn("flex flex-col gap-3", className)} aria-hidden>
        <Skeleton className="aspect-[3/4] w-full rounded-[var(--gm-radius-card)]" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    );
  }

  return (
    <article
      className={cn(
        "gm-product-card group relative flex flex-col",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.04]" aria-hidden />
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[var(--gm-radius-card)] bg-[var(--gm-surface-raised)]">
        {artwork}
        {badges ? (
          <div className="absolute start-2.5 top-2.5 z-[1] flex flex-wrap gap-1">
            {badges}
          </div>
        ) : null}
      </div>
      <div className="relative flex flex-1 flex-col gap-2 p-3.5">
        <div className="min-h-[2.6rem] text-[13px] font-semibold leading-snug text-[var(--gm-text)]">
          {title}
        </div>
        {meta ? (
          <div className="text-[11px] text-[var(--gm-text-secondary)]">{meta}</div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--gm-border)] pt-2.5">
          <div className="text-[17px] font-bold tabular-nums text-[var(--gm-text)]">
            {price}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
