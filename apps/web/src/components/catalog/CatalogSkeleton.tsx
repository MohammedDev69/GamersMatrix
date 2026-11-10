import { Skeleton } from "@/components/ui/Skeleton";

const cardGrid =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

/**
 * Skeleton mirroring CatalogPage's layout (heading + filter chips + product
 * grid). Used both in route-level loading.tsx and Suspense fallbacks so
 * navigating to any catalog page shows a real shell instead of "...".
 */
export function CatalogSkeleton({ withHint = false }: { withHint?: boolean }) {
  return (
    <div className="space-y-6" aria-busy="true">
      {withHint ? <Skeleton className="h-14 rounded-[var(--gm-radius-card)]" /> : null}
      <div className="space-y-2">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, n) => (
          <Skeleton key={n} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className={cardGrid}>
        {Array.from({ length: 10 }).map((_, n) => (
          <div key={n} className="space-y-2">
            <Skeleton className="aspect-[3/4.4] rounded-[var(--gm-radius-card)]" />
            <Skeleton className="h-3.5 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
