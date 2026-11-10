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
import { api } from "@/lib/api";
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
  /** Key into the real stats payload fetched from /admin/stats. */
  badge?: "pendingOrders" | "pendingContent" | "failedFulfillment" | "failedSchedules";
};

type NavGroup = {
  titleKey: "groupCatalog" | "groupSales" | "groupSystem";
  items: NavItem[];
};

type Stats = {
  pendingOrders?: number;
  failedFulfillment?: number;
  pendingContent?: number;
  failedSchedules?: number;
};

const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "groupCatalog",
    items: [
      { href: "/admin/products", labelKey: "products", icon: Package, permission: "products:read" },
      { href: "/admin/categories", labelKey: "categories", icon: FolderTree, permission: "products:read" },
      { href: "/admin/content", labelKey: "content", icon: FileText, permission: "content:write", badge: "pendingContent" },
      { href: "/admin/media", labelKey: "media", icon: ImageIcon, permission: "media:write" },
      { href: "/admin/campaigns", labelKey: "campaigns", icon: Percent, permission: "campaigns:write" },
    ],
  },
  {
    titleKey: "groupSales",
    items: [
      { href: "/admin/orders", labelKey: "orders", icon: ShoppingBag, permission: "orders:read", badge: "pendingOrders" },
      { href: "/admin/keys", labelKey: "keys", icon: KeyRound, permission: "keys:write" },
      { href: "/admin/customers", labelKey: "customers", icon: Users, permission: "customers:read" },
    ],
  },
  {
    titleKey: "groupSystem",
    items: [
      { href: "/admin/audit", labelKey: "audit", icon: ClipboardList, permission: "audit:read" },
      { href: "/admin/users", labelKey: "users", icon: Users, permission: "settings:write" },
      { href: "/admin/settings", labelKey: "settings", icon: Settings, permission: "settings:write" },
    ],
  },
];

/** Toast tone classes for real stat badges (zero → hidden). */
const badgeTones = {
  pendingOrders: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  pendingContent: "bg-[var(--gm-violet-950)] text-[var(--gm-violet-400)] ring-1 ring-[var(--gm-violet-800)]",
  failedFulfillment: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  failedSchedules: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
} as const;

// The overview route sits above every group; render it standalone.
const OVERVIEW: NavItem = { href: "/admin", labelKey: "overview", icon: LayoutDashboard, exact: true };

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
  const [stats, setStats] = useState<Stats | null>(null);

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

  // Live badge counts — only real numbers from /admin/stats; zeros stay hidden.
  useEffect(() => {
    if (loading || !canAccessAdmin(user) || stats) return;
    let cancelled = false;
    api
      .get<Stats>("/admin/stats")
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        /* sidebar badges are cosmetic — stay silent on failure */
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user, stats]);

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.permission || hasPermission(user, item.permission),
        ),
      })).filter((group) => group.items.length > 0),
    [user],
  );

  const badges = useMemo(() => {
    if (!stats) return {} as Record<string, number>;
    return {
      pendingOrders: stats.pendingOrders ?? 0,
      pendingContent: stats.pendingContent ?? 0,
      failedFulfillment: stats.failedFulfillment ?? 0,
      failedSchedules: stats.failedSchedules ?? 0,
    } as Record<string, number>;
  }, [stats]);

  const crumb = useMemo(() => {
    const path = stripLocale(pathname);
    const all: NavItem[] = [OVERVIEW, ...NAV_GROUPS.flatMap((g) => g.items)];
    const match = all.find((item) =>
      item.exact
        ? path === item.href
        : path === item.href || path.startsWith(`${item.href}/`),
    );
    return match ? t(match.labelKey) : t("overview");
  }, [pathname, t]);

  if (loading || !canAccessAdmin(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--gm-bg)] text-[var(--gm-text-muted)]">
        {tCommon("loading")}
      </div>
    );
  }

  const path = stripLocale(pathname);

  const isActive = (item: NavItem) =>
    item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);

  const initials = (user!.name || user!.email || "GM")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  const renderBadges = (item: NavItem) => {
    if (!item.badge) return null;
    const value = badges[item.badge];
    if (!value) return null;
    return (
      <span
        className={cn(
          "ms-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-4",
          badgeTones[item.badge],
        )}
      >
        {value > 99 ? "99+" : value}
      </span>
    );
  };

  const navBody = (
    <>
      <div className="border-b border-[var(--gm-border)] px-4 py-5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gm-violet-700)] to-[var(--gm-violet-900)] text-xs font-black text-white ring-1 ring-[var(--gm-violet-600)]"
            aria-hidden
          >
            GM
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gm-violet-400)]">
              {t("badge")}
            </p>
            <p className="truncate text-sm font-bold text-[var(--gm-text)]" dir="ltr">
              Gamers Matrix
            </p>
          </div>
        </div>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
        aria-label={t("badge")}
      >
        <Link
          href={OVERVIEW.href}
          className={cn(
            "group relative flex min-h-10 items-center gap-2.5 rounded-[var(--gm-radius-btn)] px-3 py-2 text-sm transition-all duration-150",
            isActive(OVERVIEW)
              ? "bg-[var(--gm-surface-hover)] text-[var(--gm-text)] ring-1 ring-[var(--gm-violet-800)]"
              : "text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]",
          )}
        >
          <OVERVIEW.icon className="h-4 w-4 shrink-0" aria-hidden />
          {t(OVERVIEW.labelKey)}
        </Link>

        {visibleGroups.map((group) => (
          <div key={group.titleKey} className="pt-3">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--gm-text-muted)]">
              {t(group.titleKey)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex min-h-10 items-center gap-2.5 rounded-[var(--gm-radius-btn)] px-3 py-2 text-sm transition-all duration-150",
                        active
                          ? "bg-[var(--gm-surface-hover)] font-semibold text-[var(--gm-text)] ring-1 ring-[var(--gm-violet-800)]"
                          : "text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-[var(--gm-violet-500)] transition-opacity",
                          active ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden
                      />
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-[var(--gm-violet-400)]"
                            : "text-[var(--gm-text-muted)] group-hover:text-[var(--gm-violet-400)]",
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{t(item.labelKey)}</span>
                      {renderBadges(item)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-[var(--gm-border)] p-3">
        <Link
          href="/"
          className="flex min-h-10 items-center gap-2.5 rounded-[var(--gm-radius-btn)] px-3 py-2 text-sm text-[var(--gm-text-secondary)] transition-colors hover:bg-[var(--gm-surface-hover)] hover:text-[var(--gm-text)]"
        >
          <Store className="h-4 w-4" aria-hidden />
          {t("viewStore")}
        </Link>
        <Button
          variant="ghost"
          className="w-full !justify-start !px-3"
          onClick={() => {
            void logout();
            router.push("/login");
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {tNav("logout")}
        </Button>
        <div className="mt-1 flex items-center gap-2.5 rounded-[var(--gm-radius-btn)] bg-[var(--gm-surface)] px-3 py-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gm-surface-hover)] text-[11px] font-bold text-[var(--gm-violet-300)]"
            aria-hidden
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--gm-text)]">
              {user!.name}
            </p>
            <p className="truncate text-[10px] uppercase tracking-wide text-[var(--gm-text-muted)]">
              {user!.role}
            </p>
          </div>
        </div>
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
