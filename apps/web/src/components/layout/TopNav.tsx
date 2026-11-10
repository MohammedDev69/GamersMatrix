"use client";

import {
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
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { Drawer } from "@/components/ui/Drawer";

function useNavItems() {
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

function NavLinks({
  onNavigate,
  vertical = false,
}: {
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations("Nav");
  const items = useNavItems();

  return (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--gm-radius-btn)] text-sm font-medium transition-colors duration-150",
              vertical ? "px-3 py-2.5" : "whitespace-nowrap px-3.5 py-1.5",
              active
                ? "bg-[var(--gm-violet-950)] text-[var(--gm-text)]"
                : "text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]",
            )}
          >
            {vertical ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {label}
          </Link>
        );
      })}
      {user?.role === "ADMIN" && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-[var(--gm-radius-btn)] text-sm font-semibold transition-colors",
            vertical ? "px-3 py-2.5" : "whitespace-nowrap px-3.5 py-1.5",
            "bg-[var(--gm-accent-dim)] text-[var(--gm-violet-300)] hover:bg-[var(--gm-violet-700)] hover:text-white",
          )}
        >
          {vertical ? (
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          ) : null}
          {t("admin")}
        </Link>
      )}
    </>
  );
}

/** Compact horizontal nav for mid breakpoints when rail is icon-only / hidden. */
export function TopNav() {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto lg:hidden" aria-label="Primary">
      <NavLinks />
    </nav>
  );
}

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const t = useTranslations("Nav");
  const tCommon = useTranslations("Common");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("menu")}
      side="start"
      closeLabel={tCommon("close")}
    >
      <nav className="flex flex-col gap-1">
        <div className="mb-3 px-3">
          <Logo size={32} withWordmark />
        </div>
        <NavLinks onNavigate={onClose} vertical />
        {!user && (
          <Link
            href="/login"
            onClick={onClose}
            className="mt-2 px-3 py-2.5 text-sm text-[var(--gm-text-secondary)]"
          >
            {t("login")}
          </Link>
        )}
      </nav>
    </Drawer>
  );
}
