import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const aggregate = await this.prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      avgRating:
        aggregate._avg.rating != null
          ? Math.round(aggregate._avg.rating * 10) / 10
          : 0,
      count: aggregate._count._all,
    };
  }

  async findRecent(limit = 12) {
    const take = Math.min(Math.max(limit, 1), 50);
    const reviews = await this.prisma.review.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        product: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            slug: true,
            imageUrl: true,
          },
        },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
      user: {
        id: r.user.id,
        name: this.maskName(r.user.name),
      },
      product: r.product,
    }));
  }

  async findByProduct(productIdOrSlug: string, limit = 20) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
      },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: { productId: product.id },
      take: Math.min(Math.max(limit, 1), 100),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const aggregate = await this.prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      productId: product.id,
      avgRating:
        aggregate._avg.rating != null
          ? Math.round(aggregate._avg.rating * 10) / 10
          : 0,
      count: aggregate._count._all,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          name: this.maskName(r.user.name),
        },
      })),
    };
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, active: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          userId,
          productId: dto.productId,
          rating: dto.rating,
          body: dto.body?.trim() || null,
        },
        include: {
          user: { select: { id: true, name: true } },
          product: {
            select: { id: true, title: true, slug: true },
          },
        },
      });

      return {
        id: review.id,
        rating: review.rating,
        body: review.body,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          name: this.maskName(review.user.name),
        },
        product: review.product,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You already reviewed this product');
      }
      throw error;
    }
  }

  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('Not your review');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { ok: true };
  }

  private maskName(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      const n = parts[0];
      if (n.length <= 2) return n;
      return `${n.slice(0, 2)}***`;
    }
    return `${parts[0]} ${parts[1]?.[0] ?? ''}***`;
  }
}
