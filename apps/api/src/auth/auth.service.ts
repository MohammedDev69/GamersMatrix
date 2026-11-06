import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthUser } from './decorators/current-user.decorator';
import { permissionsFor } from '../common/permissions';
import { AuditService } from '../audit/audit.service';

const ADMIN_EMAILS = new Set(['mohammed1.nasr.elshreef@gmail.com']);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        role: ADMIN_EMAILS.has(email) ? Role.ADMIN : Role.USER,
        cart: { create: {} },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return {
      user: { ...user, permissions: permissionsFor(user.role) },
      accessToken: await this.signToken(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      user: { ...safeUser, permissions: permissionsFor(safeUser.role) },
      accessToken: await this.signToken(safeUser),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...user,
      permissions: permissionsFor(user.role),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
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

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must differ from current password',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.audit.log({
      actorId: userId,
      action: 'user.password.change',
      entityType: 'user',
      entityId: userId,
      summary: 'Password changed',
    });

    // Issue a fresh token after password change (client should replace stored JWT)
    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      ok: true,
      accessToken: await this.signToken(safeUser),
      user: { ...safeUser, permissions: permissionsFor(safeUser.role) },
    };
  }

  private signToken(user: AuthUser) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
