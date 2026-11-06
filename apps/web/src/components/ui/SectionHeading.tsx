import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SectionHeadingProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
};

export function SectionHeading({
  title,
  description,
  action,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <Tag className="gm-section-title">{title}</Tag>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-[var(--gm-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
