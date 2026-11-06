import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClass: Record<BadgeTone, string> = {
  neutral: "gm-badge",
  success: "gm-badge gm-badge-success",
  warning: "gm-badge gm-badge-warning",
  danger: "gm-badge gm-badge-danger",
  info: "gm-badge gm-badge-info",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  className,
  tone = "neutral",
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(toneClass[tone], className)} {...props}>
      {children}
    </span>
  );
}

export const StatusChip = Badge;
