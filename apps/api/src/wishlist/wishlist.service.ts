import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serializeProduct } from '../common/serialize';
import { AddWishlistDto } from './dto/add-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        ...serializeProduct(item.product),
        stock: item.product._count.keys,
      },
    }));
  }

  async add(userId: string, dto: AddWishlistDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, active: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.prisma.wishlistItem.create({
        data: {
          userId,
          productId: dto.productId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product already in wishlist');
      }
      throw error;
    }

    return this.findAll(userId);
  }

  async remove(userId: string, productId: string) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.prisma.wishlistItem.delete({
      where: { id: item.id },
    });

    return this.findAll(userId);
  }
}
