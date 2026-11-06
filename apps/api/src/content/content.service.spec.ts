import { BadRequestException, ConflictException } from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';
import { ContentService } from './content.service';

describe('ContentService', () => {
  const prisma = {
    contentPage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    publicationRevision: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) => fn(prisma)),
  };
  const audit = { log: jest.fn() };
  const service = new ContentService(prisma as never, audit as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid publication transitions', async () => {
    prisma.contentPage.findUnique.mockResolvedValue({
      id: 'c1',
      publicationStatus: PublicationStatus.ARCHIVED,
      publishedAt: null,
    });
    await expect(
      service.transition('c1', PublicationStatus.PUBLISHED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires scheduledAt for SCHEDULED', async () => {
    prisma.contentPage.findUnique.mockResolvedValue({
      id: 'c1',
      publicationStatus: PublicationStatus.DRAFT,
      publishedAt: null,
    });
    await expect(
      service.transition('c1', PublicationStatus.SCHEDULED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports slug conflicts', async () => {
    prisma.contentPage.findUnique.mockResolvedValue({
      id: 'other',
      slug: 'about',
    });
    await expect(service.slugAvailable('about')).resolves.toEqual({
      available: false,
    });
    await expect(service.slugAvailable('about', 'other')).resolves.toEqual({
      available: true,
    });
  });

  it('maps unique constraint to ConflictException on create', async () => {
    const err = Object.assign(new Error('unique'), {
      code: 'P2002',
      name: 'PrismaClientKnownRequestError',
    });
    // emulate Prisma known request error instanceof check — create throws Conflict via catch
    prisma.contentPage.create.mockRejectedValue({
      ...err,
      constructor: { name: 'PrismaClientKnownRequestError' },
    });
    // Direct ConflictException path via our catch for PrismaClientKnownRequestError
    const { Prisma } = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.contentPage.create.mockRejectedValue(p2002);

    await expect(
      service.create({ slug: 'x', title: 'T', body: 'B' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
