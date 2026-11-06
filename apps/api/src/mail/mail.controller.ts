import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('admin/mail')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@RequirePermissions('settings:write')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get('status')
  status() {
    return {
      configured: this.mail.isConfigured(),
      mode: this.mail.isConfigured() ? 'smtp-env-present' : 'preview',
      note: this.mail.isConfigured()
        ? 'SMTP env vars are set; transport still uses preview until a production mailer is wired.'
        : 'No SMTP credentials — messages are development-preview only (API logs + preview endpoint).',
    };
  }

  @Get('preview')
  preview() {
    if (process.env.NODE_ENV === 'production') {
      return {
        configured: this.mail.isConfigured(),
        messages: [],
        note: 'Mail preview log is disabled in production',
      };
    }
    return {
      configured: this.mail.isConfigured(),
      messages: this.mail.getPreviewLog(),
    };
  }
}
