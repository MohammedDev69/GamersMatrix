import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

class UpdateAltDto {
  @IsString()
  @MaxLength(240)
  alt!: string;
}

class UploadMetaDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  alt?: string;
}

@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get('media/files/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const abs = this.media.resolveFilePath(filename);
    return res.sendFile(abs);
  }

  @Get('admin/media')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'media:write')
  list() {
    return this.media.list();
  }

  @Get('admin/media/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'media:write')
  get(@Param('id') id: string) {
    return this.media.get(id);
  }

  @Post('admin/media')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'media:write')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      // Aligned with MediaService.maxBytes default (5 MiB); service re-checks
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadMetaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.media.upload(file, body.alt, user.id);
  }

  @Patch('admin/media/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'media:write')
  updateAlt(
    @Param('id') id: string,
    @Body() dto: UpdateAltDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.media.updateAlt(id, dto.alt, user.id);
  }

  @Delete('admin/media/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'media:write')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.media.remove(id, user.id);
  }
}
