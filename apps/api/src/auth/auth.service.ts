import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { permissionsFor } from '../common/permissions';
import { AuditService } from '../audit/audit.service';
import type { SupabaseIdentity } from './supabase-jwt.service';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  authProvider: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly adminEmails: Set<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.adminEmails = new Set(
      (config.get<string>('SUPABASE_ADMIN_EMAILS') || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  /**
   * Links a verified Supabase identity to the existing commerce user record.
   * Matching by email preserves carts/orders during the legacy SQLite migration.
   */
  async syncSupabaseIdentity(identity: SupabaseIdentity) {
    const email = identity.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { supabaseId: identity.subject },
      select: userSelect,
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          avatarUrl: identity.avatarUrl,
          authProvider: identity.provider,
        },
        select: userSelect,
      });
    } else {
      const legacy = await this.prisma.user.findUnique({
        where: { email },
        select: userSelect,
      });

      if (legacy) {
        user = await this.prisma.user.update({
          where: { id: legacy.id },
          data: {
            supabaseId: identity.subject,
            avatarUrl: identity.avatarUrl,
            authProvider: identity.provider,
            passwordHash: null,
          },
          select: userSelect,
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            supabaseId: identity.subject,
            email,
            name: identity.name,
            avatarUrl: identity.avatarUrl,
            authProvider: identity.provider,
            role: this.adminEmails.has(email) ? Role.ADMIN : Role.USER,
            cart: { create: {} },
          },
          select: userSelect,
        });
      }
    }

    // Legacy users may not have a cart. This is idempotent and preserves its rows.
    await this.prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    return {
      ...user,
      permissions: permissionsFor(user.role),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) throw new UnauthorizedException('User not found');

    return {
      ...user,
      permissions: permissionsFor(user.role),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name.trim() },
      select: userSelect,
    });
    await this.audit.log({
      actorId: userId,
      action: 'user.profile.update',
      entityType: 'user',
      entityId: userId,
      summary: 'Updated display name',
    });
    return { ...user, permissions: permissionsFor(user.role) };
  }
}
