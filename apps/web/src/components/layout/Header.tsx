"use client";

import { FormEvent, Suspense, useState } from "react";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, User, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { MobileNav } from "./TopNav";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { LocaleSwitcher } from "./LocaleSwitcher";

const iconBtn =
  "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--gm-radius-btn)] text-[var(--gm-text-secondary)] transition-colors hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]";

export function Header() {
  const t = useTranslations("Nav");
  const tHome = useTranslations("Home");
  const ar = useLocale() === "ar";
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/shop", label: t("shop") },
    { href: "/gift-cards", label: t("giftCards") },
    { href: "/top-ups", label: t("topUps") },
    { href: "/offers", label: t("offers"), deal: true },
    { href: "/help", label: t("help") },
  ];

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/search?q=${encodeURIComponent(v)}` : "/search");
  }

  return (
    <>
      <div className="hidden border-b border-[var(--gm-border)] bg-[var(--gm-bg-deeper)] text-xs text-[var(--gm-text-muted)] md:block">
        <div className="gm-container flex h-9 items-center justify-between">
          <p className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[var(--gm-deal)]" aria-hidden />
            {ar ? "تسليم فوري لأكواد الألعاب وبطاقات الهدايا" : "Instant delivery on game keys and gift cards"}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/help" className="hover:text-[var(--gm-text)]">{t("help")}</Link>
            <Suspense fallback={null}><LocaleSwitcher /></Suspense>
            <CurrencySwitcher />
          </div>
        </div>
      </div>

      <header className="gm-header sticky top-0 z-40">
        <div className="gm-container flex h-16 items-center gap-3">
          <button type="button" className={cn(iconBtn, "lg:hidden")} aria-label={t("menu")} onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="gm-display flex shrink-0 items-center gap-2 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--gm-radius-btn)] bg-[var(--gm-violet-600)] text-base text-white" aria-hidden>G</span>
            <span className="hidden sm:inline" dir="ltr">GAMERS<span className="text-[var(--gm-violet-400)]">MATRIX</span></span>
          </Link>

          <form onSubmit={submit} role="search" className="mx-2 hidden min-w-0 flex-1 md:flex">
            <label htmlFor="hdr-search" className="sr-only">{t("search")}</label>
            <input
              id="hdr-search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={tHome("searchPlaceholder")}
              className="gm-input min-w-0 flex-1 !rounded-e-none !border-e-0"
            />
            <button type="submit" aria-label={t("search")} className="gm-btn gm-btn-primary !min-h-[44px] !rounded-s-none !px-5">
              <Search className="h-5 w-5" />
            </button>
          </form>

          <div className="ms-auto flex items-center gap-0.5 md:ms-0">
            <Link href="/wishlist" className={cn(iconBtn, "hidden sm:inline-flex")} aria-label={t("wishlist")}><Heart className="h-5 w-5" /></Link>
            <Link href="/cart" className={iconBtn} aria-label={t("cart")}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 ? (
                <span key={count} className="gm-animate-badge gm-num absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--gm-deal)] px-1 text-[10px] font-extrabold text-[var(--gm-on-deal)]">{count}</span>
              ) : null}
            </Link>
            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <Link href="/admin" className={cn(iconBtn, "hidden sm:inline-flex")} aria-label={t("admin")}><LayoutDashboard className="h-5 w-5" /></Link>
                ) : null}
                <Link href="/account" className="hidden items-center gap-1.5 rounded-[var(--gm-radius-btn)] px-3 py-2 text-sm hover:bg-[var(--gm-surface-hover)] sm:flex">
                  <User className="h-4 w-4" /><span className="max-w-[90px] truncate">{user.name}</span>
                </Link>
                <button type="button" className={iconBtn} aria-label={t("logout")} onClick={() => { logout(); router.push("/"); }}>
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link href="/login" className="gm-btn gm-btn-primary !min-h-10 !px-4 !py-2 text-sm">{t("login")}</Link>
            )}
          </div>
        </div>

        <div className="gm-container pb-2 md:hidden">
          <form onSubmit={submit} role="search" className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gm-text-muted)]" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tHome("searchPlaceholder")} aria-label={t("search")} className="gm-input !min-h-10 ps-9" />
          </form>
        </div>

        <nav aria-label="Primary" className="border-t border-[var(--gm-border)]">
          <ul className="gm-container gm-noscroll flex items-center gap-1 overflow-x-auto">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <li key={l.href} className="shrink-0">
                  <Link
                    href={l.href}
                    className={cn(
                      "relative block px-3.5 py-3 text-sm font-bold transition-colors",
                      l.deal ? "text-[var(--gm-deal)]" : active ? "text-[var(--gm-text)]" : "text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)]",
                      active && "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[var(--gm-violet-500)]",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <Suspense fallback={null}><MobileNav open={open} onClose={() => setOpen(false)} /></Suspense>
    </>
  );
}
