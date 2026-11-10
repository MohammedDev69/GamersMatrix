import Link from "next/link";
import { cn } from "@/lib/cn";

export type StatTone = "default" | "success" | "warning" | "danger";

const toneStyles: Record<StatTone, { ring: string; hint: string }> = {
  default: {
    ring: "border-[var(--gm-border)]",
    hint: "text-[var(--gm-violet-400)]",
  },
  success: {
    ring: "border-emerald-500/25",
    hint: "text-emerald-400",
  },
  warning: {
    ring: "border-amber-500/30",
    hint: "text-amber-400",
  },
  danger: {
    ring: "border-rose-500/35",
    hint: "text-rose-400",
  },
};

export type StatCardProps = {
  label: string;
  value: React.ReactNode;
  href?: string;
  hint?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  tone?: StatTone;
};

/** Admin stat tile. Wraps in a Link when `href` is provided. */
export function StatCard({
  label,
  value,
  href,
  hint,
  right,
  className,
  tone = "default",
}: StatCardProps) {
  const body = (
    <div
      className={cn(
        "h-full rounded-[var(--gm-radius-card)] border bg-[var(--gm-surface)] p-4 transition-colors duration-150",
        toneStyles[tone].ring,
        href && "hover:bg-[var(--gm-surface-hover)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-[var(--gm-text-muted)]">
          {label}
        </p>
        {right}
      </div>
      <div
        className="mt-2 text-2xl font-extrabold leading-8 text-[var(--gm-text)]"
        dir="auto"
      >
        {value}
      </div>
      {hint ? (
        <p
          className={cn(
            "mt-1.5 truncate text-xs font-medium",
            toneStyles[tone].hint,
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[var(--gm-radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gm-violet-500)] focus-visible:outline-offset-2"
      >
        {body}
      </Link>
    );
  }

  return body;
}
