import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PublicationStatus, Role } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

class ContentBodyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleEn?: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  bodyEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  seoDescription?: string;

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;
}

class TransitionDto {
  @IsEnum(PublicationStatus)
  status!: PublicationStatus;

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}

@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('content')
  listPublic() {
    return this.content.listPublic();
  }

  @Get('content/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.content.getPublicBySlug(slug);
  }

  @Get('admin/content')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  listAdmin(@Query('status') status?: PublicationStatus) {
    return this.content.listAdmin(status);
  }

  @Get('admin/content/slug-available')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  slugAvailable(
    @Query('slug') slug: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.content.slugAvailable(slug, excludeId);
  }

  @Get('admin/content/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  getOne(@Param('id') id: string) {
    return this.content.getPreview(id);
  }

  @Get('admin/content/:id/preview')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  preview(@Param('id') id: string) {
    return this.content.getPreview(id);
  }

  @Get('admin/content/:id/revisions')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  revisions(@Param('id') id: string) {
    return this.content.listRevisions(id);
  }

  @Post('admin/content')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  create(@Body() dto: ContentBodyDto, @CurrentUser() user: AuthUser) {
    return this.content.create(dto, user.id);
  }

  @Patch('admin/content/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<ContentBodyDto>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.content.update(id, dto, user.id);
  }

  @Post('admin/content/:id/revisions/:revisionId/restore')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:write')
  restore(
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.content.restoreRevision(id, revisionId, user.id);
  }

  @Post('admin/content/:id/publication')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'content:publish')
  transition(
    @Param('id') id: string,
    @Body() dto: TransitionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.content.transition(id, dto.status, dto.scheduledAt, user.id);
  }
}
