import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
  interactive?: boolean;
};

export function Card({
  className,
  elevated = false,
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "gm-card relative p-4",
        elevated && "bg-[var(--gm-surface-raised)] shadow-[var(--gm-shadow-2)]",
        interactive && "gm-card-lift cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
