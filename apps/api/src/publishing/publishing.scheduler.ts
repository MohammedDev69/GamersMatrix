import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { shouldPublishScheduled } from '../common/publication';
import { AuditService } from '../audit/audit.service';

/**
 * In-process scheduled publisher (Nest @Cron).
 * Limitation: only runs while the API process is up; missed windows catch up
 * on the next tick when the process is running again. Not distributed-safe
 * across multiple API replicas without an external lock/queue.
 */
@Injectable()
export class PublishingScheduler {
  private readonly logger = new Logger(PublishingScheduler.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.publishDue();
    } finally {
      this.running = false;
    }
  }

  /** Exposed for tests and manual admin retry-all. */
  async publishDue(now = new Date()) {
    const settings = await this.prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });
    const timezone = settings?.timezone ?? 'Africa/Cairo';

    const dueContent = await this.prisma.contentPage.findMany({
      where: {
        publicationStatus: PublicationStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
    });

    for (const page of dueContent) {
      if (!shouldPublishScheduled(page.publicationStatus, page.scheduledAt, now)) {
        continue;
      }
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.contentPage.update({
            where: { id: page.id },
            data: {
              publicationStatus: PublicationStatus.PUBLISHED,
              publishedAt: page.publishedAt ?? now,
              scheduledAt: null,
              scheduleError: null,
            },
          });
          await tx.publicationRevision.create({
            data: {
              entityType: 'content_page',
              entityId: page.id,
              snapshot: {
                slug: page.slug,
                publicationStatus: PublicationStatus.PUBLISHED,
                timezone,
              },
              note: 'Scheduled publish (cron)',
            },
          });
        });
        await this.audit.log({
          action: 'content.scheduled.publish',
          entityType: 'content_page',
          entityId: page.id,
          summary: `Auto-published ${page.slug} (${timezone})`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Scheduled publish failed';
        this.logger.error(`Content ${page.id}: ${message}`);
        await this.prisma.contentPage.update({
          where: { id: page.id },
          data: { scheduleError: message },
        });
      }
    }

    const dueProducts = await this.prisma.product.findMany({
      where: {
        publicationStatus: PublicationStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
    });

    for (const product of dueProducts) {
      if (
        !shouldPublishScheduled(
          product.publicationStatus,
          product.scheduledAt,
          now,
        )
      ) {
        continue;
      }
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.product.update({
            where: { id: product.id },
            data: {
              publicationStatus: PublicationStatus.PUBLISHED,
              publishedAt: product.publishedAt ?? now,
              scheduledAt: null,
              scheduleError: null,
              active: true,
            },
          });
          await tx.publicationRevision.create({
            data: {
              entityType: 'product',
              entityId: product.id,
              snapshot: {
                slug: product.slug,
                publicationStatus: PublicationStatus.PUBLISHED,
                timezone,
              },
              note: 'Scheduled publish (cron)',
            },
          });
        });
        await this.audit.log({
          action: 'product.scheduled.publish',
          entityType: 'product',
          entityId: product.id,
          summary: `Auto-published product ${product.slug} (${timezone})`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Scheduled publish failed';
        this.logger.error(`Product ${product.id}: ${message}`);
        await this.prisma.product.update({
          where: { id: product.id },
          data: { scheduleError: message },
        });
      }
    }

    return {
      contentPublished: dueContent.length,
      productsPublished: dueProducts.length,
      timezone,
    };
  }
}
