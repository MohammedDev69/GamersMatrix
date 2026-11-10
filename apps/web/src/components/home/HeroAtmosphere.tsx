import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Gaming-atmosphere band for the home hero only.
 * Soft blurred artwork sits under the carousel, then fades into the page
 * so the rest of the storefront stays clean above the Dot Wave.
 */
export function HeroAtmosphere({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(72vh,640px)] overflow-hidden" aria-hidden>
        <Image
          src="/brand/hero-atmosphere.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover object-[center_35%] opacity-[0.42] blur-md saturate-125"
        />
        {/* Violet wash to match brand + keep dots readable underneath */}
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_20%,rgba(139,61,255,0.22),transparent_65%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(9,6,16,0.25)] via-[rgba(9,6,16,0.55)] to-[var(--gm-bg)]" />
      </div>
      {children}
    </div>
  );
}
