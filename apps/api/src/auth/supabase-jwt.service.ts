import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SupabaseIdentity = {
  subject: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: string;
};

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function identityFromClaims(
  subject: unknown,
  email: unknown,
  userMetadata: unknown,
  appMetadata: unknown,
): SupabaseIdentity {
  const sub = stringValue(subject);
  const mail = stringValue(email)?.toLowerCase();
  if (!sub || !mail) {
    throw new UnauthorizedException('Supabase token is missing identity claims');
  }

  const user =
    userMetadata && typeof userMetadata === 'object'
      ? (userMetadata as Record<string, unknown>)
      : {};
  const app =
    appMetadata && typeof appMetadata === 'object'
      ? (appMetadata as Record<string, unknown>)
      : {};

  const name =
    stringValue(user.full_name) ||
    stringValue(user.name) ||
    stringValue(user.preferred_username) ||
    stringValue(user.user_name) ||
    mail.split('@')[0];

  return {
    subject: sub,
    email: mail,
    name,
    avatarUrl: stringValue(user.avatar_url) || stringValue(user.picture),
    provider: stringValue(app.provider),
  };
}

@Injectable()
export class SupabaseJwtService {
  private readonly url: string;
  private readonly issuer: string;
  private readonly publishableKey?: string;
  private jwks: unknown;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    this.issuer = `${this.url}/auth/v1`;
    this.publishableKey = config.get<string>('SUPABASE_PUBLISHABLE_KEY');
  }

  async verify(token: string): Promise<SupabaseIdentity> {
    try {
      // jose is ESM-only; dynamic import keeps the Nest CommonJS build compatible.
      const { createRemoteJWKSet, jwtVerify } = await import('jose');
      this.jwks ??= createRemoteJWKSet(
        new URL(`${this.issuer}/.well-known/jwks.json`),
      );
      const { payload } = await jwtVerify(
        token,
        this.jwks as ReturnType<typeof createRemoteJWKSet>,
        {
          issuer: this.issuer,
          audience: 'authenticated',
        },
      );

      return identityFromClaims(
        payload.sub,
        payload.email,
        payload.user_metadata,
        payload.app_metadata,
      );
    } catch (error) {
      // Legacy HS256 projects expose no JWKS. Validate those tokens through Auth.
      if (this.publishableKey) {
        const identity = await this.verifyWithAuthServer(token);
        if (identity) return identity;
      }
      throw new UnauthorizedException(
        error instanceof Error ? `Invalid Supabase token: ${error.message}` : 'Invalid Supabase token',
      );
    }
  }

  private async verifyWithAuthServer(
    token: string,
  ): Promise<SupabaseIdentity | null> {
    const response = await fetch(`${this.issuer}/user`, {
      headers: {
        apikey: this.publishableKey || '',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;

    const user = (await response.json()) as SupabaseUserResponse;
    return identityFromClaims(
      user.id,
      user.email,
      user.user_metadata,
      user.app_metadata,
    );
  }
}
