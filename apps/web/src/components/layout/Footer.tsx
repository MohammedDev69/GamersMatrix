"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const PAYMENT_METHODS = ["Visa", "Mastercard", "Paymob"];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/[^\d]/g, "") || "";

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
    { href: "/wishlist", label: tNav("wishlist") },
  ];

  const legalLinks = [
    { href: "/terms", label: t("terms") },
    { href: "/privacy", label: t("privacy") },
    { href: "/refund-policy", label: t("refund") },
  ];

  return (
    <footer className="gm-footer mt-16">
      <div className="gm-container py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="gm-display text-2xl font-extrabold text-[var(--gm-text)]"
            >
              <span>GAMERS </span>
              <span className="text-[var(--gm-violet-400)]">MATRIX</span>
              <span className="sr-only">{tBrand("name")}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-[var(--gm-text-secondary)]">
              {tBrand("tagline")}
            </p>
            {WHATSAPP ? (
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-[var(--gm-violet-300)] hover:underline"
              >
                WhatsApp
              </a>
            ) : null}
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold text-[var(--gm-text)]">
              {t("shop")}
            </h3>
            <ul className="space-y-2.5">
              {shopLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--gm-text-secondary)] transition hover:text-[var(--gm-text)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold text-[var(--gm-text)]">
              {t("support")}
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--gm-text-secondary)] transition hover:text-[var(--gm-text)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold text-[var(--gm-text)]">
              {t("legal")}
            </h3>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--gm-text-secondary)] transition hover:text-[var(--gm-text)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/account"
                  className="text-sm text-[var(--gm-text-secondary)] transition hover:text-[var(--gm-text)]"
                >
                  {tNav("account")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--gm-border)] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--gm-text-muted)]">
            © {year} Gamers Matrix · {t("rights")}
          </p>
          <ul className="flex flex-wrap items-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className="rounded border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[var(--gm-text-muted)]"
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
