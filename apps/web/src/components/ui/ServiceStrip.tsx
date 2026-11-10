import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

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
        "border-y border-[var(--gm-border)] bg-[var(--gm-bg-raised)]/70 px-4 py-7",
        className,
      )}
      aria-label="Service highlights"
    >
      <ul className="gm-container grid gap-4 sm:grid-cols-3 md:gap-5">
        {items.map(({ icon: Icon, label }, i) => (
          <li key={label}>
            <Reveal delayMs={i * 60}>
              <div className="flex h-full items-center gap-3.5 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gm-accent-dim)] text-[var(--gm-violet-400)] ring-1 ring-inset ring-[rgba(173,120,255,0.22)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-bold text-[var(--gm-text-secondary)]">{label}</span>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
