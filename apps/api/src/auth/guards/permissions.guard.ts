import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { Permission } from '../../common/permissions';
import { hasPermission } from '../../common/permissions';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handlerPerms =
      this.reflector.get<Permission[]>(PERMISSIONS_KEY, context.getHandler()) ??
      [];
    const classPerms =
      this.reflector.get<Permission[]>(PERMISSIONS_KEY, context.getClass()) ??
      [];
    const required = [...new Set([...classPerms, ...handlerPerms])];
    if (required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const ok = required.every((p) => hasPermission(user.role, p));
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
