import { BadRequestException } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { CampaignsService } from './campaigns.service';

describe('CampaignsService.validateCoupon', () => {
  const prisma = {
    coupon: {
      findUnique: jest.fn(),
    },
  };

  const service = new CampaignsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects expired coupons', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      code: 'OLD',
      active: true,
      type: CouponType.PERCENT,
      value: 10,
      startsAt: null,
      endsAt: new Date(Date.now() - 1000),
      maxRedemptions: null,
      redemptionCount: 0,
      minOrderEGP: null,
    });

    await expect(service.validateCoupon('OLD', 100)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('computes percent discount without going negative', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      code: 'WELCOME10',
      active: true,
      type: CouponType.PERCENT,
      value: 10,
      startsAt: null,
      endsAt: null,
      maxRedemptions: 100,
      redemptionCount: 1,
      minOrderEGP: null,
    });

    await expect(service.validateCoupon('welcome10', 200)).resolves.toEqual({
      code: 'WELCOME10',
      type: CouponType.PERCENT,
      value: 10,
      discountEGP: 20,
    });
  });

  it('caps fixed discount at order total', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      code: 'FLAT100',
      active: true,
      type: CouponType.FIXED,
      value: 100,
      startsAt: null,
      endsAt: null,
      maxRedemptions: null,
      redemptionCount: 0,
      minOrderEGP: null,
    });

    await expect(service.validateCoupon('FLAT100', 40)).resolves.toEqual({
      code: 'FLAT100',
      type: CouponType.FIXED,
      value: 100,
      discountEGP: 40,
    });
  });

  it('rejects when redemption limit reached', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      code: 'ONCE',
      active: true,
      type: CouponType.PERCENT,
      value: 5,
      startsAt: null,
      endsAt: null,
      maxRedemptions: 1,
      redemptionCount: 1,
      minOrderEGP: null,
    });

    await expect(service.validateCoupon('ONCE', 100)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
