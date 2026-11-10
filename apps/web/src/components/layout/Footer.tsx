"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";

const PAYMENT_METHODS = ["Visa", "Mastercard", "Paymob"];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/[^\d]/g, "") || "";

const LINK_CLASS =
  "text-sm font-normal text-[var(--gm-text-secondary)] transition-colors duration-200 hover:text-[var(--gm-violet-300)]";

export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const tBrand = useTranslations("Brand");
  const year = new Date().getFullYear();

  const shopLinks = [
    { href: "/shop", label: tNav("shop") },
    { href: "/offers", label: t("offers") },
    { href: "/gift-cards", label: tNav("giftCards") },
    { href: "/top-ups", label: tNav("topUps") },
  ];

  const supportLinks = [
    { href: "/help", label: t("help") },
    { href: "/contact", label: t("contact") },
    { href: "/support", label: tNav("support") },
  ];

  const legalLinks = [
    { href: "/terms", label: t("terms") },
    { href: "/privacy", label: t("privacy") },
    { href: "/refund-policy", label: t("refund") },
  ];

  const columns: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
    { title: t("shop"), links: shopLinks },
    { title: t("support"), links: supportLinks },
    { title: t("legal"), links: legalLinks },
  ];

  return (
    <footer className="gm-footer mt-16 border-t border-[var(--gm-border)]">
      <div className="gm-container py-10 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Gamers Matrix">
              <Logo size={36} />
              <span dir="ltr" className="text-sm font-medium tracking-wide text-[var(--gm-text-secondary)]">
                Gamers Matrix
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm font-normal leading-6 text-[var(--gm-text-muted)]">
              {tBrand("tagline")}
            </p>
            {WHATSAPP ? (
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--gm-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--gm-text-secondary)] transition-colors hover:border-[var(--gm-violet-500)] hover:text-[var(--gm-violet-300)]"
              >
                WhatsApp
              </a>
            ) : null}
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--gm-text-muted)]">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={LINK_CLASS}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--gm-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-normal text-[var(--gm-text-muted)]">
            © {year} Gamers Matrix · {t("rights")}
          </p>
          <ul className="flex flex-wrap items-center gap-1.5">
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className="rounded-md border border-[var(--gm-border)] px-2.5 py-0.5 text-[10px] font-normal tracking-wide text-[var(--gm-text-muted)]"
                dir="ltr"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
