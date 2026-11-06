import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, resolve, sep } from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

function isPathInsideRoot(absPath: string, root: string): boolean {
  const normalizedRoot = resolve(root).toLowerCase();
  const normalizedAbs = resolve(absPath).toLowerCase();
  if (normalizedAbs === normalizedRoot) return true;
  const prefix = normalizedRoot.endsWith(sep) ? normalizedRoot : normalizedRoot + sep;
  return normalizedAbs.startsWith(prefix);
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/** Detect image type from magic bytes (do not trust client Content-Type alone). */
function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

@Injectable()
export class MediaService {
  private readonly uploadRoot: string;
  readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {
    this.uploadRoot = this.config.get<string>(
      'MEDIA_STORAGE_PATH',
      join(process.cwd(), 'uploads'),
    );
    this.maxBytes = Number(
      this.config.get<string>('UPLOAD_MAX_BYTES', '5242880'),
    );
    if (!existsSync(this.uploadRoot)) {
      mkdirSync(this.uploadRoot, { recursive: true });
    }
  }

  list() {
    return this.prisma.mediaAsset.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        products: { include: { product: { select: { id: true, slug: true } } } },
        _count: { select: { products: true } },
      },
    });
    if (!asset) throw new NotFoundException('Media not found');
    return asset;
  }

  async upload(
    file: Express.Multer.File,
    alt: string | undefined,
    actorId?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (file.size > this.maxBytes) {
      throw new BadRequestException(
        `File exceeds max size of ${this.maxBytes} bytes`,
      );
    }

    const detected = detectImageMime(file.buffer);
    if (!detected || !ALLOWED_MIME.has(detected)) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: jpeg, png, webp, gif',
      );
    }
    const ext = MIME_TO_EXT[detected] || '.bin';
    const filename = `${randomUUID()}${ext}`;
    const absPath = join(this.uploadRoot, filename);
    writeFileSync(absPath, file.buffer);

    const port = this.config.get<string>('PORT', '3001');
    const apiBase =
      this.config.get<string>('API_PUBLIC_URL') || `http://localhost:${port}`;
    const url = `${apiBase}/media/files/${filename}`;

    const asset = await this.prisma.mediaAsset.create({
      data: {
        url,
        alt: alt?.trim() || null,
        mimeType: detected,
        sizeBytes: file.size,
      },
    });

    await this.audit.log({
      actorId,
      action: 'media.upload',
      entityType: 'media_asset',
      entityId: asset.id,
      summary: `Uploaded media (${detected}, ${file.size} bytes)`,
    });

    return asset;
  }

  async updateAlt(id: string, alt: string, actorId?: string) {
    await this.get(id);
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: { alt: alt.trim() || null },
    });
    await this.audit.log({
      actorId,
      action: 'media.update',
      entityType: 'media_asset',
      entityId: id,
      summary: 'Updated alt text',
    });
    return asset;
  }

  async remove(id: string, actorId?: string) {
    const asset = await this.get(id);
    if (asset._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete media still linked to products',
      );
    }

    // Also block if referenced as product imageUrl / ogImageUrl / content og
    const [productUse, contentUse] = await Promise.all([
      this.prisma.product.count({
        where: { OR: [{ imageUrl: asset.url }, { ogImageUrl: asset.url }] },
      }),
      this.prisma.contentPage.count({ where: { ogImageUrl: asset.url } }),
    ]);
    if (productUse > 0 || contentUse > 0) {
      throw new BadRequestException(
        'Cannot delete media still referenced by products or content',
      );
    }

    await this.prisma.mediaAsset.delete({ where: { id } });

    const filename = asset.url.split('/').pop();
    if (filename) {
      const abs = join(this.uploadRoot, filename);
      if (existsSync(abs)) {
        try {
          unlinkSync(abs);
        } catch {
          // ignore disk cleanup failure
        }
      }
    }

    await this.audit.log({
      actorId,
      action: 'media.delete',
      entityType: 'media_asset',
      entityId: id,
      summary: 'Deleted unused media',
    });
    return { deleted: true, id };
  }

  resolveFilePath(filename: string) {
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('Invalid filename');
    }
    const abs = resolve(join(this.uploadRoot, filename));
    if (!isPathInsideRoot(abs, this.uploadRoot)) {
      throw new BadRequestException('Invalid filename');
    }
    if (!existsSync(abs)) throw new NotFoundException('File not found');
    return abs;
  }
}
