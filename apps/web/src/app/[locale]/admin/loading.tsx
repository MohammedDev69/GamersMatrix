import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Route-level streaming skeleton for every /admin page.
 * Shown while the segment (which fetches data on the client) mounts —
 * gives an instant shell instead of a blank screen.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-[var(--gm-radius-hero)] lg:col-span-2" />
        <Skeleton className="h-32 rounded-[var(--gm-radius-hero)]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, n) => (
          <Skeleton key={n} className="h-16 rounded-[var(--gm-radius-card)]" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, n) => (
          <Skeleton key={n} className="h-24 rounded-[var(--gm-radius-card)]" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-[var(--gm-radius-card)]" />
    </div>
  );
}
