import Link from "next/link";
import { AtSign, Camera, KeyRound, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const SERVICES = [
  {
    href: "/products?category=account-activation",
    label: "تفعيل حسابات",
    desc: "تفعيل PlayStation وSteam والمزيد",
    icon: KeyRound,
  },
  {
    href: "/products?category=discord-nitro",
    label: "نيترو ديسكورد",
    desc: "روابط Nitro شهرية وسنوية",
    icon: Sparkles,
  },
  {
    href: "/products?category=discord-usernames",
    label: "يوزرات ديسكورد",
    desc: "يوزرات نادرة 3 و4 أحرف",
    icon: AtSign,
  },
  {
    href: "/products?category=social-usernames",
    label: "يوزرات سوشيال",
    desc: "إنستجرام وتيك توك جاهزة",
    icon: Camera,
  },
];

export function ServicesGrid() {
  return (
    <Reveal as="section" className="gm-stagger space-y-5" aria-label="الخدمات الرقمية">
      <div className="gm-reveal flex items-end justify-between gap-4">
        <div>
          <h2 className="gm-section-title">الخدمات الرقمية</h2>
          <p className="mt-1 text-sm text-[var(--gm-muted)]">
            تفعيل، نيترو، ويوزرات — تسليم سريع
          </p>
        </div>
        <Link
          href="/products?kind=SERVICE"
          className="text-sm text-[var(--gm-muted)] transition hover:text-white"
        >
          كل الخدمات
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map(({ href, label, desc, icon: Icon }, i) => (
          <li
            key={href}
            className={`gm-reveal ${i === 0 ? "lg:col-span-2" : ""}`}
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <Link
              href={href}
              className="gm-gcard group flex h-full flex-col gap-3 p-6"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#581c87] to-[#7c3aed] text-white shadow-[0_8px_24px_rgba(88,28,135,0.55)] transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">{label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--gm-muted)]">
                  {desc}
                </p>
              </div>
              <span className="mt-auto text-sm font-medium text-[var(--gm-accent-bright)]">
                تسوق الآن
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
