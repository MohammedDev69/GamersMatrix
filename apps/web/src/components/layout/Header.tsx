"use client";

import { Suspense, useState } from "react";
import { Heart, LayoutDashboard, LogOut, Menu, ShoppingCart, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/cn";
import { HeaderSearch, MobileSearch } from "./HeaderSearch";
import { MobileNav } from "./TopNav";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { LocaleSwitcher } from "./LocaleSwitcher";

const iconBtn =
  "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-[var(--gm-text-secondary)] transition-all duration-200 hover:border-[var(--gm-border)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]";

const iconBtnActive =
  "border-[rgba(165,107,255,0.35)] bg-[var(--gm-accent-dim)] text-[var(--gm-violet-300)]";

function CountBadge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span
      key={value}
      className="gm-animate-badge gm-num absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--gm-violet-600)] px-1 text-[10px] font-bold text-white shadow-[0_0_0_2px_var(--gm-bg-raised),0_4px_12px_rgba(139,61,255,0.45)]"
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

export function Header() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { items: wishlistItems } = useWishlist();
  const wishCount = wishlistItems.length;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const onWishlist = pathname === "/wishlist" || pathname.startsWith("/wishlist/");
  const onCart = pathname === "/cart" || pathname.startsWith("/cart/");

  const links = [
    { href: "/shop", label: t("shop") },
    { href: "/gift-cards", label: t("giftCards") },
    { href: "/top-ups", label: t("topUps") },
    { href: "/offers", label: t("offers"), deal: true },
    { href: "/help", label: t("help") },
  ];

  return (
    <>
      <header className="gm-header sticky top-0 z-40">
        <div className="gm-container flex h-16 items-center gap-1.5 md:gap-3">
          <button type="button" className={cn(iconBtn, "lg:hidden")} aria-label={t("menu")} onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex shrink-0 items-center" aria-label="Gamers Matrix">
            <Logo size={40} withWordmark priority />
          </Link>

          <Suspense fallback={<div className="mx-2 hidden min-w-0 flex-1 md:block" />}>
            <div className="mx-2 hidden min-w-0 flex-1 md:flex md:mx-4"><HeaderSearch /></div>
          </Suspense>

          <div className="ms-auto flex items-center gap-0.5 md:ms-0">
            <Suspense fallback={null}>
              <div className="me-1.5 hidden items-center md:flex">
                <LocaleSwitcher />
              </div>
            </Suspense>
            <div className="me-1.5 hidden md:block"><CurrencySwitcher /></div>
            <Link
              href="/wishlist"
              className={cn(iconBtn, "hidden sm:inline-flex", onWishlist && iconBtnActive, wishCount > 0 && !onWishlist && "text-[var(--gm-violet-400)]")}
              aria-label={t("wishlist")}
              aria-current={onWishlist ? "page" : undefined}
            >
              <Heart
                className="h-[18px] w-[18px]"
                strokeWidth={1.9}
                fill={wishCount > 0 || onWishlist ? "currentColor" : "none"}
                aria-hidden
              />
              <CountBadge value={wishCount} />
            </Link>
            <Link
              href="/cart"
              className={cn(iconBtn, onCart && iconBtnActive, count > 0 && !onCart && "text-[var(--gm-violet-300)]")}
              aria-label={t("cart")}
              aria-current={onCart ? "page" : undefined}
            >
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
              <CountBadge value={count} />
            </Link>
            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <Link href="/admin" className={cn(iconBtn, "hidden sm:inline-flex")} aria-label={t("admin")}><LayoutDashboard className="h-5 w-5" /></Link>
                ) : null}
                <Link href="/account" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors hover:bg-[var(--gm-surface-hover)] sm:flex">
                  <User className="h-4 w-4 text-[var(--gm-violet-400)]" /><span className="max-w-[90px] truncate">{user.name}</span>
                </Link>
                <button type="button" className={iconBtn} aria-label={t("logout")} onClick={() => { void logout(); router.push("/"); }}>
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link href="/login" className="gm-btn gm-btn-primary !min-h-9 !rounded-[10px] !px-4 text-[13px]">{t("login")}</Link>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="gm-container pb-2 md:hidden">
          <MobileSearch />
        </div>

        {/* Category nav */}
        <nav aria-label="Primary" className="border-t border-[var(--gm-border)]">
          <ul className="gm-container gm-noscroll flex items-center gap-1 overflow-x-auto">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <li key={l.href} className="shrink-0">
                  <Link
                    href={l.href}
                    className={cn(
                      "relative block px-3.5 py-2.5 text-sm font-bold transition-colors",
                      l.deal ? "text-[var(--gm-deal)]" : active ? "text-[var(--gm-text)]" : "text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)]",
                      active && "after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-[var(--gm-violet-500)] after:to-[var(--gm-violet-800)]",
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
