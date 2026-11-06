import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GiftDeliveryMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { PaymentsService } from '../payments/payments.service';
import { serializeProduct, toNumber } from '../common/serialize';
import { buildOrderTotals } from '../pricing/order-totals';
import { CheckoutDto, GiftDeliveryMethodDto } from './dto/checkout.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly campaigns: CampaignsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private buildTimeline(order: {
    createdAt: Date;
    status: string;
    fulfillmentStatus: string;
    isGift?: boolean;
    giftDelivered?: boolean;
    giftDeliveredAt?: Date | null;
    payment?: { status: string; updatedAt?: Date } | null;
    items?: Array<{
      productKey?: { deliveredAt: Date | null } | null;
    }>;
  }) {
    const events: Array<{
      key: string;
      at: string;
      label: string;
      state: 'done' | 'current' | 'pending' | 'failed';
    }> = [];

    events.push({
      key: 'created',
      at: order.createdAt.toISOString(),
      label: 'Order placed',
      state: 'done',
    });

    const payStatus = order.payment?.status;
    if (payStatus === 'SUCCESS' || order.status === 'PAID') {
      events.push({
        key: 'paid',
        at: (order.payment?.updatedAt ?? order.createdAt).toISOString?.()
          ? String(
              (order.payment?.updatedAt ?? order.createdAt).toISOString(),
            )
          : order.createdAt.toISOString(),
        label: 'Payment confirmed',
        state: 'done',
      });
    } else if (payStatus === 'FAILED' || order.status === 'FAILED') {
      events.push({
        key: 'payment_failed',
        at: order.createdAt.toISOString(),
        label: 'Payment failed',
        state: 'failed',
      });
    } else if (order.status === 'CANCELLED') {
      events.push({
        key: 'cancelled',
        at: order.createdAt.toISOString(),
        label: 'Order cancelled',
        state: 'failed',
      });
    } else {
      events.push({
        key: 'awaiting_payment',
        at: order.createdAt.toISOString(),
        label: 'Awaiting payment confirmation',
        state: 'current',
      });
    }

    const deliveredAt = order.items
      ?.map((i) => i.productKey?.deliveredAt)
      .find((d) => d != null);

    if (order.fulfillmentStatus === 'DELIVERED' || deliveredAt) {
      events.push({
        key: 'fulfilled',
        at: (deliveredAt ?? order.giftDeliveredAt ?? order.createdAt).toISOString(),
        label: order.isGift
          ? 'Gift fulfillment recorded'
          : 'Digital delivery complete',
        state: 'done',
      });
    } else if (order.fulfillmentStatus === 'FAILED') {
      events.push({
        key: 'fulfillment_failed',
        at: order.createdAt.toISOString(),
        label: 'Fulfillment failed — contact support',
        state: 'failed',
      });
    } else if (payStatus === 'SUCCESS' || order.status === 'PAID') {
      events.push({
        key: 'fulfilling',
        at: order.createdAt.toISOString(),
        label: 'Fulfillment in progress',
        state: 'current',
      });
    } else {
      events.push({
        key: 'fulfillment_pending',
        at: order.createdAt.toISOString(),
        label: 'Fulfillment after payment',
        state: 'pending',
      });
    }

    return events;
  }

  private serializeOrder<
    T extends {
      createdAt?: Date;
      status?: string;
      fulfillmentStatus?: string;
      isGift?: boolean;
      giftDelivered?: boolean;
      giftDeliveredAt?: Date | null;
      totalEGP: Prisma.Decimal | number | string;
      discountEGP?: Prisma.Decimal | number | string | null;
      items?: Array<{
        unitPriceEGP: Prisma.Decimal | number | string;
        product?: Record<string, unknown>;
        productKey?: {
          code: string;
          status: string;
          deliveredAt: Date | null;
        } | null;
      }>;
      payment?: {
        amountEGP: Prisma.Decimal | number | string;
        status?: string;
        updatedAt?: Date;
        rawPayload?: unknown;
      } | null;
    },
  >(order: T, opts?: { hideGiftKeys?: boolean; includeTimeline?: boolean }) {
    const hideKeys = opts?.hideGiftKeys !== false && order.isGift === true;

    const base = {
      ...order,
      totalEGP: toNumber(order.totalEGP) ?? 0,
      discountEGP: toNumber(order.discountEGP) ?? 0,
      items: order.items?.map((item) => ({
        ...item,
        unitPriceEGP: toNumber(item.unitPriceEGP) ?? 0,
        product: item.product ? serializeProduct(item.product) : undefined,
        productKey:
          item.productKey && !hideKeys
            ? {
                code: item.productKey.code,
                status: item.productKey.status,
                deliveredAt: item.productKey.deliveredAt,
              }
            : item.productKey
              ? {
                  code: null as unknown as string,
                  status: item.productKey.status,
                  deliveredAt: item.productKey.deliveredAt,
                  hidden: true,
                }
              : null,
      })),
      payment: order.payment
        ? {
            status: order.payment.status,
            amountEGP: toNumber(order.payment.amountEGP) ?? 0,
            updatedAt: order.payment.updatedAt,
          }
        : null,
    };

    if (opts?.includeTimeline && order.createdAt && order.status) {
      return {
        ...base,
        timeline: this.buildTimeline({
          createdAt: order.createdAt,
          status: order.status,
          fulfillmentStatus: order.fulfillmentStatus || 'PENDING',
          isGift: order.isGift,
          giftDelivered: order.giftDelivered,
          giftDeliveredAt: order.giftDeliveredAt,
          payment: order.payment
            ? {
                status: order.payment.status || 'PENDING',
                updatedAt: order.payment.updatedAt,
              }
            : null,
          items: order.items,
        }),
      };
    }

    return base;
  }

  async findAllForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            productKey: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async findOneForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: {
          include: {
            product: true,
            productKey: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Not your order');
    }

    return this.serializeOrder(order, { includeTimeline: true });
  }

  async checkout(userId: string, dto: CheckoutDto = {}) {
    const isGift = dto.isGift === true;

    if (dto.acceptTerms === false) {
      throw new BadRequestException('You must accept the terms to checkout');
    }

    if (isGift) {
      if (!dto.giftDeliveryMethod) {
        throw new BadRequestException('Gift delivery method is required');
      }
      if (!dto.recipientName?.trim()) {
        throw new BadRequestException('Recipient name is required');
      }
      if (
        dto.giftDeliveryMethod === GiftDeliveryMethodDto.EMAIL &&
        !dto.recipientEmail
      ) {
        throw new BadRequestException('Recipient email is required');
      }
      if (
        dto.giftDeliveryMethod === GiftDeliveryMethodDto.WHATSAPP &&
        !dto.recipientWhatsApp?.trim()
      ) {
        throw new BadRequestException('Recipient WhatsApp is required');
      }
    }

    const cart = await this.cartService.getCart(userId, dto.couponCode);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (cart.couponError) {
      throw new BadRequestException(cart.couponError);
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for ${item.product.title}`,
        );
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const lines = cart.items.map((item) => ({
      unitPriceEGP: Number(item.product.priceEGP) || 0,
      quantity: item.quantity,
    }));

    let discountEGP = 0;
    let couponCode: string | null = null;

    if (dto.couponCode?.trim()) {
      const validated = await this.campaigns.validateCoupon(
        dto.couponCode,
        buildOrderTotals({ lines }).subtotalEGP,
      );
      discountEGP = validated.discountEGP;
      couponCode = validated.code;
    }

    const totals = buildOrderTotals({
      lines,
      discountEGP,
      couponCode,
    });

    const lineItems = cart.items.flatMap((item) => {
      const productId = String(item.product.id ?? '');
      const title = String(item.product.title ?? 'Product');
      if (!productId) {
        throw new BadRequestException('Cart item missing product id');
      }
      return Array.from({ length: item.quantity }, () => ({
        productId,
        title,
        unitPriceEGP: new Prisma.Decimal(item.product.priceEGP),
        quantity: 1,
      }));
    });

    const giftMethod =
      dto.giftDeliveryMethod === GiftDeliveryMethodDto.EMAIL
        ? GiftDeliveryMethod.EMAIL
        : dto.giftDeliveryMethod === GiftDeliveryMethodDto.WHATSAPP
          ? GiftDeliveryMethod.WHATSAPP
          : null;

    const orderNumber = `GM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          orderNumber,
          totalEGP: new Prisma.Decimal(totals.totalEGP),
          discountEGP: new Prisma.Decimal(totals.discountEGP),
          couponCode: totals.couponCode,
          currencyCode: 'EGP',
          isGift,
          recipientName: isGift ? dto.recipientName?.trim() : null,
          recipientEmail: isGift ? (dto.recipientEmail ?? null) : null,
          recipientWhatsApp: isGift
            ? (dto.recipientWhatsApp?.trim() ?? null)
            : null,
          giftMessage: isGift ? (dto.giftMessage?.trim() ?? null) : null,
          giftDeliveryMethod: isGift ? giftMethod : null,
          items: {
            create: lineItems,
          },
          payment: {
            create: {
              amountEGP: new Prisma.Decimal(totals.totalEGP),
              currencyCode: 'EGP',
              status: 'PENDING',
            },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });

      if (totals.couponCode) {
        await tx.coupon.update({
          where: { code: totals.couponCode },
          data: { redemptionCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    const checkout = await this.paymentsService.createCheckoutForOrder({
      orderId: order.id,
      user: { name: user.name, email: user.email },
      amountEGP: totals.totalEGP,
      items: cart.items.map((item) => ({
        title: String(item.product.title ?? 'Product'),
        unitPriceEGP: Number(item.product.priceEGP) || 0,
        quantity: item.quantity,
      })),
    });

    return {
      ...checkout,
      orderNumber: order.orderNumber,
      totals,
    };
  }
}
