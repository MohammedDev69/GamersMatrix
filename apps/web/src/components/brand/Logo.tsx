import Image from "next/image";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  /** Pixel size of the circular mark */
  size?: number;
  /** Show "Gamers Matrix" text beside the mark */
  withWordmark?: boolean;
  priority?: boolean;
};

export function Logo({
  className,
  size = 40,
  withWordmark = false,
  priority = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/brand/logo.jpg"
        alt=""
        width={size}
        height={size}
        priority={priority}
        className="shrink-0 rounded-full object-cover ring-1 ring-[rgba(165,107,255,0.35)] shadow-[0_0_16px_rgba(139,61,255,0.28)]"
        aria-hidden
      />
      {withWordmark ? (
        <span dir="ltr" className="hidden leading-none sm:block" aria-hidden>
          <span className="block pb-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--gm-text-muted)]">
            Gamers
          </span>
          <span className="gm-display block text-[16px] font-semibold tracking-wide text-[var(--gm-violet-300)]">
            MATRIX
          </span>
        </span>
      ) : null}
      <span className="sr-only">Gamers Matrix</span>
    </span>
  );
}
