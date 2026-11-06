import { Role } from '@prisma/client';
import { hasPermission, permissionsFor } from './permissions';

describe('role permissions', () => {
  it('gives USER no admin permissions', () => {
    expect(permissionsFor(Role.USER)).toEqual([]);
    expect(hasPermission(Role.USER, 'admin:access')).toBe(false);
  });

  it('allows EDITOR to write products but not publish or manage keys', () => {
    expect(hasPermission(Role.EDITOR, 'admin:access')).toBe(true);
    expect(hasPermission(Role.EDITOR, 'products:write')).toBe(true);
    expect(hasPermission(Role.EDITOR, 'products:publish')).toBe(false);
    expect(hasPermission(Role.EDITOR, 'keys:write')).toBe(false);
  });

  it('allows ADMIN full privileged surface', () => {
    expect(hasPermission(Role.ADMIN, 'products:publish')).toBe(true);
    expect(hasPermission(Role.ADMIN, 'keys:write')).toBe(true);
    expect(hasPermission(Role.ADMIN, 'audit:read')).toBe(true);
    expect(hasPermission(Role.ADMIN, 'settings:write')).toBe(true);
  });
});
