"use client";

import {
  Gamepad2,
  Gift,
  Headphones,
  Home,
  LayoutDashboard,
  Percent,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

function useRailItems() {
  const t = useTranslations("Nav");
  return [
    { href: "/", label: t("home"), icon: Home },
    { href: "/shop", label: t("shop"), icon: ShoppingBag },
    { href: "/offers", label: t("offers"), icon: Percent },
    { href: "/gift-cards", label: t("giftCards"), icon: Gift },
    { href: "/top-ups", label: t("topUps"), icon: Zap },
    { href: "/help", label: t("help"), icon: Headphones },
  ] as const;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Distinctive left desktop navigation rail (physical left per design contract). */
export function NavRail() {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations("Nav");
  const items = useRailItems();

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen w-[var(--gm-rail-width)] flex-col border-r border-[var(--gm-border)] bg-[var(--gm-bg-raised)] pt-[calc(var(--gm-header-height)+1.25rem)] lg:flex xl:w-[var(--gm-rail-width-expanded)]"
      aria-label={t("menu")}
    >
      <nav className="flex flex-1 flex-col gap-1 p-2 xl:p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "group relative flex items-center gap-3 rounded-[var(--gm-radius-btn)] px-2.5 py-2.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-[var(--gm-violet-950)] text-[var(--gm-text)]"
                  : "text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]",
              )}
            >
              {active ? (
                <span
                  className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[var(--gm-violet-500)]"
                  aria-hidden
                />
              ) : null}
              <Icon className="mx-auto h-5 w-5 shrink-0 xl:mx-0" aria-hidden />
              <span className="hidden truncate xl:inline">{label}</span>
            </Link>
          );
        })}
        {user?.role === "ADMIN" ? (
          <Link
            href="/admin"
            title={t("admin")}
            className={cn(
              "mt-2 flex items-center gap-3 rounded-[var(--gm-radius-btn)] px-2.5 py-2.5 text-sm font-semibold transition-colors",
              isActive(pathname, "/admin")
                ? "bg-[var(--gm-accent-dim)] text-[var(--gm-violet-300)]"
                : "text-[var(--gm-violet-400)] hover:bg-[var(--gm-accent-dim)]",
            )}
          >
            <LayoutDashboard
              className="mx-auto h-5 w-5 shrink-0 xl:mx-0"
              aria-hidden
            />
            <span className="hidden truncate xl:inline">{t("admin")}</span>
          </Link>
        ) : null}
      </nav>
      <div className="hidden items-center justify-center gap-2 border-t border-[var(--gm-border)] p-3 text-[var(--gm-violet-400)] xl:flex">
        <Gamepad2 className="h-4 w-4" aria-hidden />
        <span className="text-xs font-semibold tracking-wide" dir="ltr">
          MATRIX
        </span>
      </div>
    </aside>
  );
}
