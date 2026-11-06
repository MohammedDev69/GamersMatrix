jest.mock('@nestjs/config', () => ({
  ConfigService: class {
    get(_key: string, fallback?: string) {
      return fallback ?? '';
    }
  },
}));

jest.mock('../payments/payments.service', () => ({
  PaymentsService: class {},
}));

jest.mock('../payments/paymob.service', () => ({
  PaymobService: class {},
}));

import { BadRequestException } from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';
import { AdminService } from './admin.service';

describe('AdminService product publish validation', () => {
  const prisma = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    publicationRevision: { create: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) => fn(prisma)),
  };
  const audit = { log: jest.fn() };
  const payments = {};
  const service = new AdminService(
    prisma as never,
    audit as never,
    payments as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('blocks publish without required fields', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      publicationStatus: PublicationStatus.DRAFT,
      title: '  ',
      description: 'ok',
      imageUrl: 'http://x',
      publishedAt: null,
      scheduledAt: null,
      active: true,
    });

    await expect(
      service.transitionProductPublication(
        'p1',
        { status: PublicationStatus.PUBLISHED },
        'actor',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
