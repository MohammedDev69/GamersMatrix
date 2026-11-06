import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  action?: ReactNode;
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  className,
  action,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <AlertTriangle
        className="h-8 w-8 text-[var(--gm-danger)]"
        aria-hidden
      />
      <h2 className="text-lg font-semibold text-[var(--gm-text)]">{title}</h2>
      {description ? (
        <p className="max-w-md text-sm text-[var(--gm-text-secondary)]">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      ) : null}
      {action}
    </div>
  );
}
