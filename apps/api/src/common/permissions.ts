import { Role } from '@prisma/client';

export type Permission =
  | 'products:read'
  | 'products:write'
  | 'products:publish'
  | 'categories:write'
  | 'orders:read'
  | 'orders:write'
  | 'keys:write'
  | 'customers:read'
  | 'campaigns:write'
  | 'content:write'
  | 'content:publish'
  | 'settings:write'
  | 'audit:read'
  | 'media:write'
  | 'admin:access';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [],
  EDITOR: [
    'admin:access',
    'products:read',
    'products:write',
    'categories:write',
    'content:write',
    'media:write',
    'campaigns:write',
    'orders:read',
  ],
  ADMIN: [
    'admin:access',
    'products:read',
    'products:write',
    'products:publish',
    'categories:write',
    'orders:read',
    'orders:write',
    'keys:write',
    'customers:read',
    'campaigns:write',
    'content:write',
    'content:publish',
    'settings:write',
    'audit:read',
    'media:write',
  ],
};

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}
