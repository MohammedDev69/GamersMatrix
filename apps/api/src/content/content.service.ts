import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertPublicationTransition } from '../common/publication';
import { AuditService } from '../audit/audit.service';

export type ContentUpsertInput = {
  slug: string;
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
  locale?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  internalNotes?: string;
};

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPublic() {
    return this.prisma.contentPage.findMany({
      where: { publicationStatus: PublicationStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        body: true,
        bodyEn: true,
        locale: true,
        seoTitle: true,
        seoDescription: true,
        ogImageUrl: true,
        publishedAt: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  async getPublicBySlug(slug: string) {
    const page = await this.prisma.contentPage.findFirst({
      where: { slug, publicationStatus: PublicationStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        body: true,
        bodyEn: true,
        locale: true,
        seoTitle: true,
        seoDescription: true,
        ogImageUrl: true,
        publishedAt: true,
      },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  /** Preview any status without publishing — admin only. */
  async getPreview(id: string) {
    const page = await this.prisma.contentPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    return {
      ...page,
      preview: true,
      publicationStatus: page.publicationStatus,
    };
  }

  listAdmin(status?: PublicationStatus) {
    return this.prisma.contentPage.findMany({
      where: status ? { publicationStatus: status } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async slugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.contentPage.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });
    if (!existing) return { available: true };
    if (excludeId && existing.id === excludeId) return { available: true };
    return { available: false };
  }

  async create(data: ContentUpsertInput, actorId?: string) {
    const slug = data.slug.trim().toLowerCase();
    try {
      const page = await this.prisma.contentPage.create({
        data: {
          slug,
          title: data.title,
          titleEn: data.titleEn ?? null,
          body: data.body,
          bodyEn: data.bodyEn ?? null,
          locale: data.locale ?? 'ar',
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          ogImageUrl: data.ogImageUrl ?? null,
          internalNotes: data.internalNotes ?? null,
          publicationStatus: PublicationStatus.DRAFT,
        },
      });
      await this.prisma.publicationRevision.create({
        data: {
          entityType: 'content_page',
          entityId: page.id,
          editorId: actorId ?? null,
          snapshot: page as unknown as Prisma.InputJsonValue,
          note: 'Created draft',
        },
      });
      await this.audit.log({
        actorId,
        action: 'content.create',
        entityType: 'content_page',
        entityId: page.id,
        summary: `Created content page ${page.slug}`,
      });
      return page;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Content slug already exists');
      }
      throw error;
    }
  }

  async update(id: string, data: Partial<ContentUpsertInput>, actorId?: string) {
    const existing = await this.prisma.contentPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page not found');

    try {
      const page = await this.prisma.contentPage.update({
        where: { id },
        data: {
          slug: data.slug?.trim().toLowerCase(),
          title: data.title,
          titleEn: data.titleEn,
          body: data.body,
          bodyEn: data.bodyEn,
          locale: data.locale,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          ogImageUrl: data.ogImageUrl,
          internalNotes: data.internalNotes,
        },
      });

      await this.prisma.publicationRevision.create({
        data: {
          entityType: 'content_page',
          entityId: id,
          editorId: actorId ?? null,
          snapshot: page as unknown as Prisma.InputJsonValue,
          note: 'Manual save',
        },
      });

      await this.audit.log({
        actorId,
        action: 'content.update',
        entityType: 'content_page',
        entityId: id,
        summary: `Saved content ${page.slug}`,
        metadata: {
          before: {
            title: existing.title,
            slug: existing.slug,
            publicationStatus: existing.publicationStatus,
          },
          after: {
            title: page.title,
            slug: page.slug,
            publicationStatus: page.publicationStatus,
          },
        },
      });

      return page;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Content slug already exists');
      }
      throw error;
    }
  }

  listRevisions(id: string) {
    return this.prisma.publicationRevision.findMany({
      where: { entityType: 'content_page', entityId: id },
      include: {
        editor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async restoreRevision(id: string, revisionId: string, actorId?: string) {
    const page = await this.prisma.contentPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    const revision = await this.prisma.publicationRevision.findFirst({
      where: { id: revisionId, entityType: 'content_page', entityId: id },
    });
    if (!revision) throw new NotFoundException('Revision not found');

    const snap = revision.snapshot as Record<string, unknown>;
    const restored = await this.prisma.contentPage.update({
      where: { id },
      data: {
        title: typeof snap.title === 'string' ? snap.title : page.title,
        titleEn:
          typeof snap.titleEn === 'string' ? snap.titleEn : page.titleEn,
        body: typeof snap.body === 'string' ? snap.body : page.body,
        bodyEn: typeof snap.bodyEn === 'string' ? snap.bodyEn : page.bodyEn,
        seoTitle:
          typeof snap.seoTitle === 'string' ? snap.seoTitle : page.seoTitle,
        seoDescription:
          typeof snap.seoDescription === 'string'
            ? snap.seoDescription
            : page.seoDescription,
        ogImageUrl:
          typeof snap.ogImageUrl === 'string'
            ? snap.ogImageUrl
            : page.ogImageUrl,
        internalNotes:
          typeof snap.internalNotes === 'string'
            ? snap.internalNotes
            : page.internalNotes,
        // Do not restore publication status from snapshot — avoid accidental publish
      },
    });

    await this.prisma.publicationRevision.create({
      data: {
        entityType: 'content_page',
        entityId: id,
        editorId: actorId ?? null,
        snapshot: restored as unknown as Prisma.InputJsonValue,
        note: `Restored revision ${revisionId}`,
      },
    });

    await this.audit.log({
      actorId,
      action: 'content.revision.restore',
      entityType: 'content_page',
      entityId: id,
      summary: `Restored revision ${revisionId}`,
    });

    return restored;
  }

  async transition(
    id: string,
    status: PublicationStatus,
    scheduledAt?: string,
    actorId?: string,
  ) {
    const existing = await this.prisma.contentPage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Page not found');
    assertPublicationTransition(existing.publicationStatus, status);
    if (status === PublicationStatus.SCHEDULED && !scheduledAt) {
      throw new BadRequestException('scheduledAt required for SCHEDULED');
    }

    const page = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.contentPage.update({
        where: { id },
        data: {
          publicationStatus: status,
          scheduledAt:
            status === PublicationStatus.SCHEDULED
              ? new Date(scheduledAt!)
              : null,
          scheduleError: null,
          publishedAt:
            status === PublicationStatus.PUBLISHED
              ? (existing.publishedAt ?? new Date())
              : existing.publishedAt,
        },
      });
      await tx.publicationRevision.create({
        data: {
          entityType: 'content_page',
          entityId: id,
          editorId: actorId ?? null,
          snapshot: updated as unknown as Prisma.InputJsonValue,
          note: `${existing.publicationStatus} → ${status}`,
        },
      });
      return updated;
    });

    await this.audit.log({
      actorId,
      action: 'content.publication.transition',
      entityType: 'content_page',
      entityId: id,
      summary: `${existing.publicationStatus} → ${status}`,
    });
    return page;
  }
}
