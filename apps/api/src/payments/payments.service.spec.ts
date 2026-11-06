jest.mock('@nestjs/config', () => ({
  ConfigService: class {
    get(_key: string, fallback?: string) {
      return fallback ?? '';
    }
  },
}));

jest.mock('./paymob.service', () => ({
  PaymobService: class {
    name = 'paymob';
    isConfigured() {
      return true;
    }
    verifyWebhookSignature() {
      return true;
    }
  },
}));

import { BadRequestException } from '@nestjs/common';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService webhook idempotency', () => {
  const paymentEvent = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  const payment = {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const order = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const prisma = {
    payment,
    paymentEvent,
    order,
    $transaction: jest.fn(),
  };

  const paymob = {
    name: 'paymob',
    isConfigured: jest.fn().mockReturnValue(true),
    createCheckout: jest.fn(),
    verifyWebhookSignature: jest.fn().mockReturnValue(true),
    verifyHmac: jest.fn().mockReturnValue(true),
  };

  const config = {
    get: jest.fn((key: string, fallback?: string) => fallback ?? ''),
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      prisma as never,
      paymob as never,
      config as never,
    );
  });

  it('rejects invalid HMAC', async () => {
    paymob.verifyWebhookSignature.mockReturnValue(false);
    await expect(
      service.handleWebhook({ orderId: 'o1', success: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips duplicate provider events', async () => {
    paymob.verifyWebhookSignature.mockReturnValue(true);
    payment.findUnique.mockResolvedValue({
      id: 'pay1',
      orderId: 'ord1',
      transactionId: null,
      order: {
        status: OrderStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.PENDING,
      },
    });
    paymentEvent.findUnique.mockResolvedValue({ id: 'evt1' });

    await expect(
      service.handleWebhook({
        orderId: 'ord1',
        success: true,
        id: 'txn-1',
      }),
    ).resolves.toMatchObject({
      received: true,
      processed: false,
      duplicate: true,
    });
    expect(paymentEvent.create).not.toHaveBeenCalled();
  });

  it('does not re-fulfill already delivered orders', async () => {
    paymob.verifyWebhookSignature.mockReturnValue(true);
    payment.findUnique.mockResolvedValue({
      id: 'pay1',
      orderId: 'ord1',
      transactionId: 'txn-old',
      order: {
        status: OrderStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.DELIVERED,
      },
    });
    paymentEvent.findUnique.mockResolvedValue(null);
    paymentEvent.create.mockResolvedValue({ id: 'evt2' });

    const deliverSpy = jest
      .spyOn(service, 'deliverOrderKeys')
      .mockResolvedValue({} as never);

    await expect(
      service.handleWebhook({
        orderId: 'ord1',
        success: true,
        id: 'txn-2',
      }),
    ).resolves.toMatchObject({
      received: true,
      processed: false,
      duplicate: true,
      status: 'PAID',
    });
    expect(deliverSpy).not.toHaveBeenCalled();
  });

  it('handleReturn never fulfills from client success flags', async () => {
    const deliverSpy = jest.spyOn(service, 'deliverOrderKeys');
    order.findUnique.mockResolvedValue({
      id: 'ord1',
      status: OrderStatus.PENDING,
      payment: { status: PaymentStatus.PENDING },
    });

    const url = await service.handleReturn({
      orderId: 'ord1',
      success: 'true',
    });

    expect(deliverSpy).not.toHaveBeenCalled();
    expect(url).toContain('pending=1');
  });
});

describe('PaymentsService.reconcileFulfillment', () => {
  it('refuses unpaid orders', async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          status: OrderStatus.PENDING,
          payment: { status: PaymentStatus.PENDING },
        }),
      },
    };
    const service = new PaymentsService(
      prisma as never,
      {
        name: 'paymob',
        isConfigured: () => false,
        verifyWebhookSignature: () => true,
      } as never,
      { get: () => '' } as never,
    );

    await expect(service.reconcileFulfillment('o1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
