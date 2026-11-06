import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--gm-radius-card)] border border-dashed border-[var(--gm-border)] bg-[var(--gm-surface)] px-6 py-12 text-center",
        className,
      )}
      role="status"
    >
      {icon ? (
        <div className="text-[var(--gm-violet-400)]" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-[var(--gm-text)]">{title}</h2>
      {description ? (
        <p className="max-w-md text-sm text-[var(--gm-text-secondary)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
