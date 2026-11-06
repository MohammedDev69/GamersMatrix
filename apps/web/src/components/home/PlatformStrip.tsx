import Link from "next/link";
import { Gamepad2, MessageCircle, Monitor, Camera } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const PLATFORMS = [
  { href: "/products?platform=PlayStation", label: "PlayStation", icon: Gamepad2 },
  { href: "/products?platform=Xbox", label: "Xbox", icon: Gamepad2 },
  { href: "/products?platform=Steam", label: "Steam", icon: Monitor },
  { href: "/products?platform=Discord", label: "Discord", icon: MessageCircle },
  { href: "/products?platform=Instagram", label: "Instagram", icon: Camera },
];

export function PlatformStrip() {
  return (
    <Reveal as="section" className="gm-stagger space-y-4" aria-label="تسوق حسب المنصة">
      <div className="gm-reveal">
        <h2 className="gm-section-title">تسوق حسب المنصة</h2>
        <p className="mt-1 text-sm text-[var(--gm-muted)]">
          ألعاب وخدمات رقمية للمنصة التي تلعب عليها
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {PLATFORMS.map(({ href, label, icon: Icon }, i) => (
          <li
            key={href}
            className="gm-reveal"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <Link
              href={href}
              className="group flex flex-col items-center gap-2.5 rounded-[var(--gm-radius-card)] border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-5 text-center transition duration-300 hover:-translate-y-1 hover:border-[var(--gm-accent)] hover:bg-[var(--gm-surface-2)] hover:shadow-[0_10px_28px_rgba(88,28,135,0.28)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--gm-accent-dim)] text-[var(--gm-accent-bright)] transition group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-xs text-[var(--gm-muted)] transition group-hover:text-[var(--gm-accent-bright)]">
                تصفح الكل
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
