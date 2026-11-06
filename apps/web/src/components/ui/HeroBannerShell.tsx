import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type HeroBannerShellProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  className?: string;
};

/** Cinematic hero frame — content supplied by page/feature components. */
export function HeroBannerShell({
  title,
  subtitle,
  actions,
  media,
  className,
}: HeroBannerShellProps) {
  return (
    <section
      className={cn(
        "gm-hero relative flex min-h-[220px] flex-col justify-end overflow-hidden md:min-h-[280px]",
        className,
      )}
    >
      {media ? (
        <div className="absolute inset-0" aria-hidden>
          {media}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gm-bg)] via-[var(--gm-bg)]/55 to-transparent" />
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(124,42,232,0.35),transparent_55%)]"
          aria-hidden
        />
      )}
      <div className="relative z-10 flex flex-col gap-3 p-6 md:p-8 lg:max-w-2xl">
        <div className="gm-display text-3xl font-extrabold leading-tight text-[var(--gm-text)] md:text-4xl lg:text-5xl">
          {title}
        </div>
        {subtitle ? (
          <p className="max-w-xl text-sm text-[var(--gm-text-secondary)] md:text-base">
            {subtitle}
          </p>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
