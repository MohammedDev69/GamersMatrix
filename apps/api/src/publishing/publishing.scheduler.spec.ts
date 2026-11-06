import { PublicationStatus } from '@prisma/client';
import { PublishingScheduler } from './publishing.scheduler';

describe('PublishingScheduler', () => {
  const prisma = {
    storeSettings: { findUnique: jest.fn() },
    contentPage: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    publicationRevision: { create: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    ),
  };
  const audit = { log: jest.fn() };
  const scheduler = new PublishingScheduler(prisma as never, audit as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.storeSettings.findUnique.mockResolvedValue({
      timezone: 'Africa/Cairo',
    });
    prisma.contentPage.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
  });

  it('publishes due scheduled content', async () => {
    const now = new Date('2026-06-01T12:00:00Z');
    prisma.contentPage.findMany.mockResolvedValue([
      {
        id: 'p1',
        slug: 'sale',
        publicationStatus: PublicationStatus.SCHEDULED,
        scheduledAt: new Date('2026-06-01T11:00:00Z'),
        publishedAt: null,
      },
    ]);
    prisma.contentPage.update.mockResolvedValue({});
    prisma.publicationRevision.create.mockResolvedValue({});

    const result = await scheduler.publishDue(now);
    expect(result.contentPublished).toBe(1);
    expect(prisma.contentPage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({
          publicationStatus: PublicationStatus.PUBLISHED,
          scheduleError: null,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
  });

  it('records scheduleError when publish fails', async () => {
    const now = new Date('2026-06-01T12:00:00Z');
    prisma.contentPage.findMany.mockResolvedValue([
      {
        id: 'p1',
        slug: 'sale',
        publicationStatus: PublicationStatus.SCHEDULED,
        scheduledAt: new Date('2026-06-01T11:00:00Z'),
        publishedAt: null,
      },
    ]);
    prisma.$transaction.mockRejectedValue(new Error('db down'));
    prisma.contentPage.update.mockResolvedValue({});

    await scheduler.publishDue(now);
    expect(prisma.contentPage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { scheduleError: 'db down' },
      }),
    );
  });
});
