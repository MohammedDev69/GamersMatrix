"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FileText,
  FolderTree,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { canAccessAdmin, hasPermission, type Permission } from "@/lib/permissions";

type NavKey =
  | "overview"
  | "products"
  | "categories"
  | "content"
  | "media"
  | "campaigns"
  | "orders"
  | "keys"
  | "customers"
  | "audit"
  | "users"
  | "settings";

type NavItem = {
  href: string;
  labelKey: NavKey;
  icon: typeof LayoutDashboard;
  permission?: Permission;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", labelKey: "overview", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/products",
    labelKey: "products",
    icon: Package,
    permission: "products:read",
  },
  {
    href: "/admin/categories",
    labelKey: "categories",
    icon: FolderTree,
    permission: "products:read",
  },
  {
    href: "/admin/content",
    labelKey: "content",
    icon: FileText,
    permission: "content:write",
  },
  {
    href: "/admin/media",
    labelKey: "media",
    icon: ImageIcon,
    permission: "media:write",
  },
  {
    href: "/admin/campaigns",
    labelKey: "campaigns",
    icon: Percent,
    permission: "campaigns:write",
  },
  {
    href: "/admin/orders",
    labelKey: "orders",
    icon: ShoppingBag,
    permission: "orders:read",
  },
  {
    href: "/admin/keys",
    labelKey: "keys",
    icon: KeyRound,
    permission: "keys:write",
  },
  {
    href: "/admin/customers",
    labelKey: "customers",
    icon: Users,
    permission: "customers:read",
  },
  {
    href: "/admin/audit",
    labelKey: "audit",
    icon: ClipboardList,
    permission: "audit:read",
  },
  {
    href: "/admin/users",
    labelKey: "users",
    icon: Users,
    permission: "settings:write",
  },
  {
    href: "/admin/settings",
    labelKey: "settings",
    icon: Settings,
    permission: "settings:write",
  },
];

function stripLocale(pathname: string) {
  return pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tNav = useTranslations("Nav");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !canAccessAdmin(user)) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [navOpen]);

  const visibleNav = useMemo(
    () =>
      NAV.filter(
        (item) => !item.permission || hasPermission(user, item.permission),
      ),
    [user],
  );

  const crumb = useMemo(() => {
    const path = stripLocale(pathname);
    const match = visibleNav.find((item) =>
      item.exact
        ? path === item.href
        : path === item.href || path.startsWith(`${item.href}/`),
    );
    return match ? t(match.labelKey) : t("overview");
  }, [pathname, t, visibleNav]);

  if (loading || !canAccessAdmin(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--gm-bg)] text-[var(--gm-text-muted)]">
        {tCommon("loading")}
      </div>
    );
  }

  const path = stripLocale(pathname);

  const navBody = (
    <>
      <div className="border-b border-[var(--gm-border)] px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gm-violet-400)]">
          {t("badge")}
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--gm-text)]" dir="ltr">
          Gamers Matrix
        </p>
        <p className="mt-2 truncate text-xs text-[var(--gm-text-muted)]">
          {user!.name} · {user!.role}
        </p>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
        aria-label={t("badge")}
      >
        {visibleNav.map(({ href, labelKey, icon: Icon, exact }) => {
          const active = exact
            ? path === href
            : path === href || path.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-[var(--gm-radius-btn)] px-3 py-2.5 text-sm transition-colors duration-150",
                active
                  ? "bg-[var(--gm-violet-950)] text-[var(--gm-text)] ring-1 ring-[var(--gm-violet-800)]"
                  : "text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-[var(--gm-border)] p-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 rounded-[var(--gm-radius-btn)] px-3 py-2.5 text-sm text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]"
        >
          <Store className="h-4 w-4" aria-hidden />
          {t("viewStore")}
        </Link>
        <Button
          variant="ghost"
          className="w-full !justify-start !px-3"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {tNav("logout")}
        </Button>
        <p className="px-3 pt-2 text-xs text-[var(--gm-text-muted)]" dir="ltr">
          {user!.email}
        </p>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-[var(--gm-border)] bg-[var(--gm-bg-raised)] md:flex">
        {navBody}
      </aside>

      {navOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label={tCommon("close")}
            onClick={() => setNavOpen(false)}
          />
          <aside
            className="absolute inset-y-0 start-0 flex w-[min(100%,16rem)] flex-col border-e border-[var(--gm-border)] bg-[var(--gm-bg-raised)] shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("badge")}
          >
            <div className="flex items-center justify-end border-b border-[var(--gm-border)] p-2">
              <IconButton
                label={tCommon("close")}
                onClick={() => setNavOpen(false)}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </IconButton>
            </div>
            {navBody}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--gm-border)] bg-[var(--gm-bg-raised)]/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-start gap-3">
            <IconButton
              label={t("openNav")}
              onClick={() => setNavOpen(true)}
              className="mt-0.5 h-10 w-10 shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </IconButton>
            <div className="min-w-0 flex-1">
              <nav
                aria-label="Breadcrumb"
                className="text-xs text-[var(--gm-text-muted)]"
              >
                <ol className="flex flex-wrap items-center gap-1.5">
                  <li>{t("badge")}</li>
                  <li aria-hidden>/</li>
                  <li className="font-medium text-[var(--gm-text-secondary)]">
                    {crumb}
                  </li>
                </ol>
              </nav>
              <h1 className="mt-1 text-xl font-bold text-[var(--gm-text)] md:text-2xl">
                {crumb}
              </h1>
            </div>
          </div>
        </header>
        <main id="main-content" className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
