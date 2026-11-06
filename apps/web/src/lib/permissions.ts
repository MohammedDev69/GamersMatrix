import type { User } from "./api";

export type Permission =
  | "products:read"
  | "products:write"
  | "products:publish"
  | "categories:write"
  | "orders:read"
  | "orders:write"
  | "keys:write"
  | "customers:read"
  | "campaigns:write"
  | "content:write"
  | "content:publish"
  | "settings:write"
  | "audit:read"
  | "media:write"
  | "admin:access";

const ROLE_FALLBACK: Record<string, Permission[]> = {
  EDITOR: [
    "admin:access",
    "products:read",
    "products:write",
    "categories:write",
    "content:write",
    "media:write",
    "campaigns:write",
    "orders:read",
  ],
  ADMIN: [
    "admin:access",
    "products:read",
    "products:write",
    "products:publish",
    "categories:write",
    "orders:read",
    "orders:write",
    "keys:write",
    "customers:read",
    "campaigns:write",
    "content:write",
    "content:publish",
    "settings:write",
    "audit:read",
    "media:write",
  ],
};

export function canAccessAdmin(user: User | null | undefined) {
  return user?.role === "ADMIN" || user?.role === "EDITOR";
}

export function hasPermission(
  user: User | null | undefined,
  permission: Permission,
) {
  if (!user) return false;
  const list =
    user.permissions && user.permissions.length > 0
      ? user.permissions
      : ROLE_FALLBACK[user.role] ?? [];
  return list.includes(permission);
}
