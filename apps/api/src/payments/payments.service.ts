import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FulfillmentStatus,
  KeyStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/serialize';
import { PaymobService } from './paymob.service';
import type { PaymentProvider } from './payment-provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymob: PaymobService,
    private readonly config: ConfigService,
  ) {
    this.provider = paymob;
  }

  /**
   * Assign product keys after trusted payment verification.
   * Idempotent: already-PAID + DELIVERED orders return immediately.
   */
  async deliverOrderKeys(orderId: string) {
    return this.prisma
      .$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { productKey: true } },
            payment: true,
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (
          order.status === OrderStatus.PAID &&
          order.fulfillmentStatus === FulfillmentStatus.DELIVERED
        ) {
          return tx.order.findUnique({
            where: { id: order.id },
            include: {
              items: { include: { productKey: true, product: true } },
              payment: true,
            },
          });
        }

        if (
          order.payment &&
          order.payment.status !== PaymentStatus.SUCCESS &&
          order.payment.status !== PaymentStatus.PENDING
        ) {
          throw new BadRequestException('Payment not in a fulfillable state');
        }

        for (const item of order.items) {
          if (item.productKey) {
            continue;
          }

          const units = Math.max(1, item.quantity);

          for (let i = 0; i < units; i++) {
            const availableKey = await tx.productKey.findFirst({
              where: {
                productId: item.productId,
                status: KeyStatus.AVAILABLE,
              },
              orderBy: { createdAt: 'asc' },
            });

            if (!availableKey) {
              throw new BadRequestException(
                `No available keys for product ${item.title}`,
              );
            }

            let targetItemId = item.id;

            if (i === 0) {
              if (item.quantity !== 1) {
                await tx.orderItem.update({
                  where: { id: item.id },
                  data: { quantity: 1 },
                });
              }
            } else {
              const extra = await tx.orderItem.create({
                data: {
                  orderId: order.id,
                  productId: item.productId,
                  title: item.title,
                  unitPriceEGP: item.unitPriceEGP,
                  quantity: 1,
                },
              });
              targetItemId = extra.id;
            }

            await tx.productKey.update({
              where: { id: availableKey.id },
              data: {
                status: KeyStatus.DELIVERED,
                orderItemId: targetItemId,
                deliveredAt: new Date(),
              },
            });

            await tx.product.update({
              where: { id: item.productId },
              data: { soldCount: { increment: 1 } },
            });
          }
        }

        const paidOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            fulfillmentStatus: FulfillmentStatus.DELIVERED,
            ...(order.isGift
              ? { giftDelivered: true, giftDeliveredAt: new Date() }
              : {}),
          },
        });

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: PaymentStatus.SUCCESS },
          });
        }

        if (paidOrder.isGift) {
          this.logger.log(
            `Gift order ${paidOrder.id} ready for delivery via ${paidOrder.giftDeliveryMethod} to ${paidOrder.recipientEmail || paidOrder.recipientWhatsApp}`,
          );
        }

        return tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: { include: { productKey: true, product: true } },
            payment: true,
          },
        });
      })
      .catch(async (error: unknown) => {
        if (!(error instanceof NotFoundException)) {
          try {
            await this.prisma.order.update({
              where: { id: orderId },
              data: { fulfillmentStatus: FulfillmentStatus.FAILED },
            });
          } catch {
            // ignore secondary failure
          }
        }
        throw error;
      });
  }

  async markPaymentFailed(orderId: string, rawPayload?: unknown) {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.FAILED },
      });
      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: PaymentStatus.FAILED,
          rawPayload: rawPayload as Prisma.InputJsonValue | undefined,
        },
      });
    });
  }

  /**
   * Idempotent webhook: verify HMAC, dedupe by providerEventId, fulfill only once.
   */
  async handleWebhook(body: Record<string, unknown>, hmacHeader?: string) {
    const receivedHmac =
      hmacHeader ||
      (typeof body.hmac === 'string' ? body.hmac : undefined) ||
      (typeof body.HMAC === 'string' ? body.HMAC : undefined);

    if (!this.provider.verifyWebhookSignature(body, receivedHmac)) {
      throw new BadRequestException('Invalid HMAC signature');
    }

    const obj =
      body.obj && typeof body.obj === 'object'
        ? (body.obj as Record<string, unknown>)
        : body;

    const success =
      obj.success === true ||
      obj.success === 'true' ||
      obj.success === 'True' ||
      body.success === true;

    const orderId =
      (typeof obj.special_reference === 'string' && obj.special_reference) ||
      (typeof obj.merchant_order_id === 'string' && obj.merchant_order_id) ||
      (typeof body.special_reference === 'string' && body.special_reference) ||
      (typeof body.orderId === 'string' && body.orderId) ||
      null;

    const transactionId =
      obj.id?.toString?.() ||
      obj.transaction_id?.toString?.() ||
      (typeof body.transactionId === 'string' ? body.transactionId : null);

    const providerEventId =
      (transactionId ? `${this.provider.name}:${transactionId}` : null) ||
      (typeof body.id === 'string' ? `${this.provider.name}:${body.id}` : null);

    if (!orderId) {
      this.logger.warn('Webhook missing order reference');
      return { received: true, processed: false };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      this.logger.warn(`Webhook for unknown order ${orderId}`);
      return { received: true, processed: false };
    }

    if (providerEventId) {
      const existing = await this.prisma.paymentEvent.findUnique({
        where: { providerEventId },
      });
      if (existing) {
        return {
          received: true,
          processed: false,
          duplicate: true,
          status: payment.order.status,
        };
      }
    }

    if (
      payment.order.status === OrderStatus.PAID &&
      payment.order.fulfillmentStatus === FulfillmentStatus.DELIVERED
    ) {
      if (providerEventId) {
        await this.prisma.paymentEvent.create({
          data: {
            paymentId: payment.id,
            providerEventId,
            eventType: success
              ? 'payment.success.replay'
              : 'payment.failed.replay',
            payload: body as Prisma.InputJsonValue,
          },
        });
      }
      return {
        received: true,
        processed: false,
        duplicate: true,
        status: 'PAID',
      };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: transactionId ?? payment.transactionId,
        rawPayload: body as Prisma.InputJsonValue,
      },
    });

    if (providerEventId) {
      try {
        await this.prisma.paymentEvent.create({
          data: {
            paymentId: payment.id,
            providerEventId,
            eventType: success ? 'payment.success' : 'payment.failed',
            payload: body as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return {
            received: true,
            processed: false,
            duplicate: true,
          };
        }
        throw error;
      }
    }

    if (success) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCESS },
      });
      await this.deliverOrderKeys(orderId);
      return { received: true, processed: true, status: 'PAID' };
    }

    await this.markPaymentFailed(orderId, body);
    return { received: true, processed: true, status: 'FAILED' };
  }

  /**
   * Browser return is NOT payment proof. Redirect based on DB state only.
   * Never fulfill from client query params when the real provider is configured.
   */
  async handleReturn(query: Record<string, string | undefined>) {
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const orderId =
      query.orderId ||
      query.special_reference ||
      query.merchant_order_id ||
      undefined;

    if (!orderId) {
      return `${frontendUrl}/ar/checkout/failed`;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return `${frontendUrl}/ar/checkout/failed?orderId=${orderId}`;
    }

    if (
      order.status === OrderStatus.PAID ||
      order.payment?.status === PaymentStatus.SUCCESS
    ) {
      const mockFlag = this.provider.isConfigured() ? '' : '&mock=1';
      return `${frontendUrl}/ar/checkout/success?orderId=${orderId}${mockFlag}`;
    }

    if (
      order.status === OrderStatus.FAILED ||
      order.payment?.status === PaymentStatus.FAILED
    ) {
      return `${frontendUrl}/ar/checkout/failed?orderId=${orderId}`;
    }

    // Pending: show pending confirmation — do not trust client success flags
    return `${frontendUrl}/ar/checkout/success?orderId=${orderId}&pending=1`;
  }

  async createCheckoutForOrder(params: {
    orderId: string;
    user: { name: string; email: string };
    amountEGP: number;
    items: Array<{ title: string; unitPriceEGP: number; quantity: number }>;
  }) {
    const port = this.config.get<string>('PORT', '3001');
    const apiBase =
      this.config.get<string>('API_PUBLIC_URL') || `http://localhost:${port}`;

    const amountInCents = Math.round(params.amountEGP * 100);

    const intention = await this.provider.createCheckout({
      orderId: params.orderId,
      amountEGP: params.amountEGP,
      user: params.user,
      items: params.items,
      notificationUrl: `${apiBase}/payments/webhook`,
      redirectionUrl: `${apiBase}/payments/return`,
    });

    await this.prisma.payment.update({
      where: { orderId: params.orderId },
      data: {
        paymobIntentionId: intention.intentionId ?? null,
        status: PaymentStatus.PENDING,
      },
    });

    // Dev-only mock: credentials absent → fulfill immediately after intentional mock checkout
    if (intention.mock) {
      await this.prisma.payment.update({
        where: { orderId: params.orderId },
        data: { status: PaymentStatus.SUCCESS },
      });
      await this.deliverOrderKeys(params.orderId);
    }

    return {
      orderId: params.orderId,
      checkoutUrl: intention.checkoutUrl,
      clientSecret: intention.clientSecret,
      publicKey: intention.publicKey,
      mock: intention.mock,
      provider: this.provider.name,
      amountEGP: params.amountEGP,
      amountInCents,
    };
  }

  /**
   * Operator retry: re-run fulfillment for paid orders without charging again.
   */
  async reconcileFulfillment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.payment?.status !== PaymentStatus.SUCCESS &&
      order.status !== OrderStatus.PAID
    ) {
      throw new BadRequestException(
        'Cannot reconcile fulfillment without verified payment',
      );
    }

    if (
      order.status === OrderStatus.PAID &&
      order.fulfillmentStatus === FulfillmentStatus.DELIVERED
    ) {
      return {
        orderId,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        reconciled: false,
        reason: 'already_delivered',
      };
    }

    await this.deliverOrderKeys(orderId);
    const refreshed = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    return {
      orderId,
      status: refreshed?.status,
      fulfillmentStatus: refreshed?.fulfillmentStatus,
      reconciled: true,
    };
  }

  async getPaymentByOrder(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      ...payment,
      amountEGP: toNumber(payment.amountEGP) ?? 0,
      order: {
        ...payment.order,
        totalEGP: toNumber(payment.order.totalEGP) ?? 0,
      },
    };
  }
}
