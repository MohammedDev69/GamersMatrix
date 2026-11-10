import { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

export function AdminTableSkeleton({
  rows = 8,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--gm-radius-card)] border border-[var(--gm-border)]",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="grid gap-3 border-b border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16 max-w-full" />
        ))}
      </div>
      <div className="divide-y divide-[var(--gm-border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid items-center gap-3 px-3 py-3.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn("h-4 max-w-full", c === 0 ? "w-3/4" : "w-1/2")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCardsSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-[var(--gm-radius-card)]" />
      ))}
    </div>
  );
}

type AdminListStateProps = {
  loading: boolean;
  empty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  skeleton?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Prevents the "لا يوجد شيء" flash: skeleton while loading, empty only after load.
 */
export function AdminListState({
  loading,
  empty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  skeleton,
  children,
  className,
}: AdminListStateProps) {
  if (loading) {
    return (
      <div className={className}>{skeleton ?? <AdminTableSkeleton />}</div>
    );
  }
  if (empty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }
  return <>{children}</>;
}
