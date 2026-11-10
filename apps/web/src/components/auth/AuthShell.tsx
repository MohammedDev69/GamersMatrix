"use client";

import type { ReactNode } from "react";
import { KeyRound, ShieldCheck, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";

function MatrixMark() {
  return (
    <span
      className="grid h-10 w-10 grid-cols-2 gap-1 rounded-[11px] bg-[var(--gm-cta-gradient)] p-2 shadow-[0_8px_24px_rgba(139,61,255,0.3)] ring-1 ring-inset ring-white/25"
      aria-hidden
    >
      <span className="rounded-[2px] bg-white" />
      <span className="rounded-[2px] bg-white/50" />
      <span className="rounded-[2px] bg-white/50" />
      <span className="rounded-[2px] bg-white/90" />
    </span>
  );
}

export function AuthShell({
  ar,
  eyebrow,
  title,
  description,
  children,
}: {
  ar: boolean;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const features = ar
    ? [
        { icon: Zap, title: "وصول أسرع", body: "حساب واحد للمشتريات والطلبات الرقمية." },
        { icon: ShieldCheck, title: "جلسة محمية", body: "مصادقة آمنة ومدارة بواسطة Supabase." },
        { icon: KeyRound, title: "خيارات مرنة", body: "سجل بالبريد أو Google أو Discord." },
      ]
    : [
        { icon: Zap, title: "Faster access", body: "One account for purchases and digital orders." },
        { icon: ShieldCheck, title: "Protected session", body: "Secure authentication managed by Supabase." },
        { icon: KeyRound, title: "Flexible sign-in", body: "Continue with email, Google, or Discord." },
      ];

  return (
    <main className="relative flex min-h-[100dvh] items-center overflow-hidden bg-[var(--gm-bg)] px-4 py-6 sm:px-6 lg:py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(700px 460px at 12% 8%, rgba(139,61,255,.13), transparent 65%), radial-gradient(800px 520px at 92% 94%, rgba(111,46,224,.1), transparent 68%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-3 transition-opacity hover:opacity-85 lg:mb-6"
            aria-label="Gamers Matrix"
          >
            <MatrixMark />
            <span dir="ltr" className="leading-none">
              <span className="block text-[9px] font-bold uppercase tracking-[.32em] text-[var(--gm-text-muted)]">
                Gamers
              </span>
              <span className="gm-display mt-1 block text-[17px] font-black tracking-tight text-[var(--gm-text)]">
                MATRIX
              </span>
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.992 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
          className="grid min-h-[650px] overflow-hidden rounded-[24px] border border-[var(--gm-border-strong)] bg-[var(--gm-bg-raised)] shadow-[0_28px_90px_rgba(4,2,10,.48)] lg:grid-cols-[.86fr_1.14fr]"
        >
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="relative hidden overflow-hidden border-e border-[var(--gm-border)] bg-[#120b20] p-10 lg:flex lg:flex-col xl:p-12"
          >
            <div
              className="pointer-events-none absolute -end-36 -top-24 h-96 w-96 rounded-full bg-[rgba(139,61,255,.12)] blur-[90px]"
              aria-hidden
            />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[var(--gm-violet-400)]">
                {ar ? "حساب GAMERS MATRIX" : "GAMERS MATRIX ACCOUNT"}
              </p>
              <h2 className="mt-5 max-w-md text-4xl font-black leading-[1.3] tracking-tight text-[var(--gm-text)] xl:text-[44px]">
                {ar
                  ? "كل مشترياتك الرقمية في مكان واحد."
                  : "Every digital purchase in one place."}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[var(--gm-text-secondary)]">
                {ar
                  ? "تابع طلباتك، احفظ منتجاتك، واستلم مشترياتك من حساب آمن وسريع."
                  : "Track orders, save products, and receive purchases from one fast, secure account."}
              </p>
            </div>

            <ul className="relative mt-10 space-y-3">
              {features.map(({ icon: Icon, title: featureTitle, body }, index) => (
                <motion.li
                  key={featureTitle}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.22 + index * 0.07 }}
                  className="group flex gap-3.5 border-t border-[var(--gm-border)] py-4 first:border-t-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--gm-accent-dim)] text-[var(--gm-violet-400)] transition-colors group-hover:bg-[rgba(139,61,255,.22)]">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-[var(--gm-text)]">
                      {featureTitle}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--gm-text-muted)]">
                      {body}
                    </span>
                  </span>
                </motion.li>
              ))}
            </ul>

            <p className="relative mt-auto border-t border-[var(--gm-border)] pt-5 text-xs leading-6 text-[var(--gm-text-muted)]">
              {ar
                ? "لن نطلب كلمة مرور Google أو Discord منك داخل الموقع."
                : "We never ask for your Google or Discord password inside the store."}
            </p>
          </motion.aside>

          <motion.section
            initial={reduceMotion ? false : { opacity: 0, x: ar ? -14 : 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.52, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center bg-[var(--gm-surface)] px-5 py-8 sm:px-10 lg:px-14 xl:px-20"
          >
            <div className="mx-auto w-full max-w-[480px]">
              <div className="mb-7">
                <p className="text-xs font-extrabold text-[var(--gm-violet-400)]">
                  {eyebrow}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--gm-text)] sm:text-[36px]">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-7 text-[var(--gm-text-secondary)]">
                  {description}
                </p>
              </div>
              {children}
            </div>
          </motion.section>
        </motion.div>

        <p className="mt-5 text-center text-[11px] text-[var(--gm-text-muted)]">
          © {new Date().getFullYear()} Gamers Matrix · {ar ? "دخول آمن عبر Supabase" : "Secure access powered by Supabase"}
        </p>
      </div>
    </main>
  );
}
