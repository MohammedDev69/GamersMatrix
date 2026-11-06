import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type ServiceStripItem = {
  icon: LucideIcon;
  label: string;
};

export type ServiceStripProps = {
  items: ServiceStripItem[];
  className?: string;
};

export function ServiceStrip({ items, className }: ServiceStripProps) {
  return (
    <section
      className={cn(
        "mt-8 border-y border-[var(--gm-border)] bg-[var(--gm-bg-raised)] px-4 py-6",
        className,
      )}
      aria-label="Service highlights"
    >
      <ul className="gm-container flex flex-wrap items-center justify-center gap-8 md:gap-16">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2 text-sm font-bold text-[var(--gm-text-secondary)]"
          >
            <Icon
              className="h-5 w-5 text-[var(--gm-violet-400)]"
              aria-hidden
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
