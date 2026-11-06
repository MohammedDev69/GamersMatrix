import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PublishingScheduler } from './publishing.scheduler';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Controller('admin/publishing')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.EDITOR)
export class PublishingController {
  constructor(
    private readonly scheduler: PublishingScheduler,
    private readonly prisma: PrismaService,
  ) {}

  /** Manual catch-up for operators (does not require a browser tab open for cron). */
  @Post('run-due')
  @RequirePermissions('admin:access', 'content:publish')
  runDue() {
    return this.scheduler.publishDue();
  }

  @Post('content/:id/retry-schedule')
  @RequirePermissions('admin:access', 'content:publish')
  async retryContent(@Param('id') id: string) {
    const page = await this.prisma.contentPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    if (page.publicationStatus !== PublicationStatus.SCHEDULED) {
      throw new BadRequestException('Page is not scheduled');
    }
    await this.prisma.contentPage.update({
      where: { id },
      data: { scheduleError: null },
    });
    return this.scheduler.publishDue();
  }

  @Post('products/:id/retry-schedule')
  @RequirePermissions('admin:access', 'products:publish')
  async retryProduct(@Param('id') id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.publicationStatus !== PublicationStatus.SCHEDULED) {
      throw new BadRequestException('Product is not scheduled');
    }
    await this.prisma.product.update({
      where: { id },
      data: { scheduleError: null },
    });
    return this.scheduler.publishDue();
  }
}
