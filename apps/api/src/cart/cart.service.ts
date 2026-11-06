import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { serializeProduct, toNumber } from '../common/serialize';
import { buildOrderTotals } from '../pricing/order-totals';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: CampaignsService,
  ) {}

  private async getOrCreateCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
    });
  }

  private async loadCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const full = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                _count: {
                  select: { keys: { where: { status: 'AVAILABLE' } } },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!full) {
      throw new NotFoundException('Cart not found');
    }

    return full;
  }

  async getCart(userId: string, couponCode?: string) {
    const full = await this.loadCart(userId);

    const items = full.items.map((item) => {
      const product = {
        ...serializeProduct(item.product),
        stock: item.product._count.keys,
      };
      const unitPrice = toNumber(item.product.priceEGP) ?? 0;
      return {
        id: item.id,
        quantity: item.quantity,
        product,
        lineTotalEGP: unitPrice * item.quantity,
      };
    });

    const lines = items.map((item) => ({
      unitPriceEGP: Number(item.product.priceEGP) || 0,
      quantity: item.quantity,
    }));

    let discountEGP = 0;
    let appliedCoupon: string | null = null;
    let couponError: string | null = null;

    if (couponCode?.trim()) {
      try {
        const subtotal = buildOrderTotals({ lines }).subtotalEGP;
        const validated = await this.campaigns.validateCoupon(
          couponCode,
          subtotal,
        );
        discountEGP = validated.discountEGP;
        appliedCoupon = validated.code;
      } catch (error) {
        couponError = error instanceof Error ? error.message : 'Invalid coupon';
      }
    }

    const totals = buildOrderTotals({
      lines,
      discountEGP,
      couponCode: appliedCoupon,
    });

    return {
      id: full.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      ...totals,
      /** @deprecated Prefer totalEGP from server totals */
      totalEGP: totals.totalEGP,
      couponError,
    };
  }

  async quote(userId: string, couponCode?: string) {
    return this.getCart(userId, couponCode);
  }

  private async assertPurchasableProduct(productId: string, quantity: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        active: true,
        publicationStatus: PublicationStatus.PUBLISHED,
      },
      include: {
        _count: { select: { keys: { where: { status: 'AVAILABLE' } } } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product._count.keys < quantity) {
      throw new BadRequestException('Not enough keys in stock');
    }

    return product;
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.assertPurchasableProduct(
      dto.productId,
      dto.quantity,
    );

    const cart = await this.getOrCreateCart(userId);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    const nextQty = (existing?.quantity ?? 0) + dto.quantity;
    if (product._count.keys < nextQty) {
      throw new BadRequestException('Not enough keys in stock');
    }

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: {
        quantity: nextQty,
      },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        product: {
          include: {
            _count: { select: { keys: { where: { status: 'AVAILABLE' } } } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (item.product.publicationStatus !== PublicationStatus.PUBLISHED) {
      throw new BadRequestException('Product is no longer available');
    }

    if (item.product._count.keys < dto.quantity) {
      throw new BadRequestException('Not enough keys in stock');
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
}
