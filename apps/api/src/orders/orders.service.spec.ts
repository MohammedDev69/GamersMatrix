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

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService access control', () => {
  const prisma = {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const service = new OrdersService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('denies access to another user order', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord1',
      userId: 'owner',
      isGift: false,
      totalEGP: 10,
      discountEGP: 0,
      items: [],
      payment: null,
    });

    await expect(
      service.findOneForUser('intruder', 'ord1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns not found for missing orders', async () => {
    prisma.order.findFirst.mockResolvedValue(null);
    await expect(
      service.findOneForUser('u1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
