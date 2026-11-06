"use client";

import { KeyRound, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const TRUST = [
  {
    icon: ShieldCheck,
    title: "دفع آمن",
    desc: "حماية كاملة لبياناتك عبر بوابات موثوقة",
  },
  {
    icon: Zap,
    title: "تسليم فوري",
    desc: "الكود يصل إلى حسابك خلال ثوانٍ",
  },
  {
    icon: KeyRound,
    title: "أكواد أصلية",
    desc: "مفاتيح رسمية لمنصات الألعاب",
  },
];

export function FeatureBar() {
  return (
    <Reveal as="section" className="gm-stagger pt-2">
      <div className="grid gap-3 sm:grid-cols-3">
        {TRUST.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="gm-reveal gm-gcard group flex items-start gap-3.5 p-5"
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#581c87] to-[#7c3aed] text-white shadow-[0_8px_22px_rgba(88,28,135,0.5)]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--gm-muted)]">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
