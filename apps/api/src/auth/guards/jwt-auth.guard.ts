import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../decorators/current-user.decorator';
import { AuthService } from '../auth.service';
import { SupabaseJwtService } from '../supabase-jwt.service';

type AuthenticatedRequest = Request & { user?: AuthUser };

/**
 * Kept under the existing class name so every protected commerce/admin route
 * automatically switches from the legacy app JWT to Supabase Auth JWTs.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly verifier: SupabaseJwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') || [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const identity = await this.verifier.verify(token);
    const user = await this.auth.syncSupabaseIdentity(identity);
    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return true;
  }
}
