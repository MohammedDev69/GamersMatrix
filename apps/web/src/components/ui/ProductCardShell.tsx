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
        "gm-card gm-card-lift group flex flex-col overflow-hidden p-0",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--gm-surface-raised)]">
        {artwork}
        {badges ? (
          <div className="absolute start-2 top-2 flex flex-wrap gap-1">
            {badges}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-h-[2.5rem] text-[15px] font-semibold leading-snug text-[var(--gm-text)]">
          {title}
        </div>
        {meta ? (
          <div className="text-xs text-[var(--gm-text-secondary)]">{meta}</div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="text-lg font-bold tabular-nums text-[var(--gm-text)]">
            {price}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
