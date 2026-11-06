import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  listCampaigns() {
    return this.prisma.campaign.findMany({
      include: { coupons: true },
      orderBy: { priority: 'desc' },
    });
  }

  async createCampaign(data: {
    name: string;
    slug: string;
    description?: string;
  }) {
    try {
      return await this.prisma.campaign.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Campaign slug already exists');
      }
      throw error;
    }
  }

  async createCoupon(data: {
    code: string;
    type: CouponType;
    value: number;
    campaignId?: string;
    maxRedemptions?: number;
    minOrderEGP?: number;
    startsAt?: string;
    endsAt?: string;
  }) {
    if (data.value <= 0) {
      throw new BadRequestException('Coupon value must be positive');
    }
    if (data.type === CouponType.PERCENT && data.value > 100) {
      throw new BadRequestException('Percent coupon cannot exceed 100');
    }
    try {
      return await this.prisma.coupon.create({
        data: {
          code: data.code.trim().toUpperCase(),
          type: data.type,
          value: new Prisma.Decimal(data.value),
          campaignId: data.campaignId ?? null,
          maxRedemptions: data.maxRedemptions ?? null,
          minOrderEGP:
            data.minOrderEGP != null
              ? new Prisma.Decimal(data.minOrderEGP)
              : null,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          endsAt: data.endsAt ? new Date(data.endsAt) : null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Coupon code already exists');
      }
      throw error;
    }
  }

  async updateCampaign(
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: CampaignStatus;
      startsAt?: string | null;
      endsAt?: string | null;
      priority?: number;
    },
  ) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');
    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        startsAt:
          data.startsAt === null
            ? null
            : data.startsAt
              ? new Date(data.startsAt)
              : undefined,
        endsAt:
          data.endsAt === null
            ? null
            : data.endsAt
              ? new Date(data.endsAt)
              : undefined,
        priority: data.priority,
      },
      include: { coupons: true },
    });
  }

  async updateCoupon(
    id: string,
    data: {
      active?: boolean;
      maxRedemptions?: number | null;
      minOrderEGP?: number | null;
      startsAt?: string | null;
      endsAt?: string | null;
    },
  ) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Coupon not found');
    return this.prisma.coupon.update({
      where: { id },
      data: {
        active: data.active,
        maxRedemptions: data.maxRedemptions,
        minOrderEGP:
          data.minOrderEGP === null
            ? null
            : data.minOrderEGP != null
              ? new Prisma.Decimal(data.minOrderEGP)
              : undefined,
        startsAt:
          data.startsAt === null
            ? null
            : data.startsAt
              ? new Date(data.startsAt)
              : undefined,
        endsAt:
          data.endsAt === null
            ? null
            : data.endsAt
              ? new Date(data.endsAt)
              : undefined,
      },
    });
  }

  async validateCoupon(code: string, orderTotalEGP: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      throw new NotFoundException('Coupon not found');
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('Coupon not started yet');
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestException('Coupon expired');
    }
    if (
      coupon.maxRedemptions != null &&
      coupon.redemptionCount >= coupon.maxRedemptions
    ) {
      throw new BadRequestException('Coupon redemption limit reached');
    }
    const min = coupon.minOrderEGP ? Number(coupon.minOrderEGP) : 0;
    if (orderTotalEGP < min) {
      throw new BadRequestException('Order total below coupon minimum');
    }

    let discount = 0;
    if (coupon.type === CouponType.PERCENT) {
      discount = (orderTotalEGP * Number(coupon.value)) / 100;
    } else {
      discount = Number(coupon.value);
    }
    discount = Math.min(discount, orderTotalEGP);
    return {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discountEGP: Math.round(discount * 100) / 100,
    };
  }
}
