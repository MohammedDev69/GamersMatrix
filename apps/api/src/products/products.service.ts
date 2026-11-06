import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductKind, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Lang, resolveLang, serializePublicProduct } from '../common/serialize';
import { parsePage, pageMeta } from '../common/pagination';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapProduct<
    T extends {
      _count?: { keys: number; reviews?: number };
      reviews?: Array<{ rating: number }>;
      [key: string]: unknown;
    },
  >(product: T, lang: Lang) {
    const { _count, reviews, ...rest } = product;
    const ratingCount = _count?.reviews ?? reviews?.length ?? 0;
    const avgRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return {
      ...serializePublicProduct(rest, lang),
      // Boolean availability only — never expose raw key codes publicly
      inStock: (_count?.keys ?? 0) > 0,
      stock: _count?.keys ?? 0,
      availableKeys: _count?.keys ?? 0,
      reviewCount: ratingCount,
      avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
    };
  }

  private productInclude() {
    return {
      category: true,
      reviews: { select: { rating: true } },
      _count: {
        select: {
          keys: { where: { status: 'AVAILABLE' as const } },
          reviews: true,
        },
      },
    };
  }

  private publicWhere(): Prisma.ProductWhereInput {
    return {
      active: true,
      publicationStatus: PublicationStatus.PUBLISHED,
    };
  }

  async findAll(query: {
    category?: string;
    featured?: string;
    weeklyDeal?: string;
    search?: string;
    kind?: string;
    platform?: string;
    bestsellers?: string;
    popular?: string;
    hot?: string;
    isNew?: string;
    lang?: string;
    limit?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }) {
    const lang = resolveLang(query.lang);
    const where: Prisma.ProductWhereInput = { ...this.publicWhere() };

    if (query.category) {
      where.OR = [
        { categoryId: query.category },
        { category: { slug: query.category } },
      ];
    }

    if (query.featured === 'true' || query.featured === '1') {
      where.featured = true;
    }
    if (query.weeklyDeal === 'true' || query.weeklyDeal === '1') {
      where.weeklyDeal = true;
    }
    if (query.hot === 'true' || query.hot === '1') {
      where.hot = true;
    }
    if (query.isNew === 'true' || query.isNew === '1') {
      where.isNew = true;
    }

    if (query.kind) {
      const kind = query.kind.toUpperCase();
      if (Object.values(ProductKind).includes(kind as ProductKind)) {
        where.kind = kind as ProductKind;
      }
    }

    if (query.platform) {
      where.platform = { contains: query.platform };
    }

    if (query.search) {
      const term = query.search.trim();
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        {
          OR: [
            { title: { contains: term } },
            { titleEn: { contains: term } },
            { description: { contains: term } },
            { descriptionEn: { contains: term } },
            { platform: { contains: term } },
          ],
        },
      ];
    }

    const isBestsellers =
      query.bestsellers === 'true' || query.bestsellers === '1';
    const isPopular = query.popular === 'true' || query.popular === '1';

    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [
      { createdAt: 'desc' },
    ];
    if (query.sort === 'price_asc') orderBy = [{ priceEGP: 'asc' }];
    else if (query.sort === 'price_desc') orderBy = [{ priceEGP: 'desc' }];
    else if (
      query.sort === 'popular' ||
      isBestsellers ||
      isPopular ||
      query.sort === 'sold'
    ) {
      orderBy = [{ soldCount: 'desc' }, { title: 'asc' }];
    } else if (query.sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }];
    }

    const limitRaw = query.limit ? Number(query.limit) : undefined;
    const useLegacyLimit =
      Number.isFinite(limitRaw) && limitRaw! > 0 && !query.page;

    if (useLegacyLimit || isBestsellers || isPopular) {
      const take = useLegacyLimit
        ? Math.min(limitRaw!, 100)
        : Math.min(Number(query.limit) || 12, 100);
      const products = await this.prisma.product.findMany({
        where,
        include: this.productInclude(),
        orderBy,
        take,
      });
      return products.map((product) => this.mapProduct(product, lang));
    }

    const { page, pageSize, skip, take } = parsePage(query);
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: this.productInclude(),
        orderBy,
        skip,
        take,
      }),
    ]);

    // Backward-compatible: when no page param, return array only via legacy path above.
    // With page/pageSize, return envelope.
    if (query.page || query.pageSize) {
      return {
        items: products.map((product) => this.mapProduct(product, lang)),
        meta: pageMeta(total, page, pageSize),
      };
    }

    return products.map((product) => this.mapProduct(product, lang));
  }

  async findFeatured(langParam?: string) {
    const lang = resolveLang(langParam);
    const products = await this.prisma.product.findMany({
      where: { ...this.publicWhere(), featured: true },
      include: this.productInclude(),
      orderBy: { title: 'asc' },
    });
    return products.map((product) => this.mapProduct(product, lang));
  }

  async findWeeklyDeal(langParam?: string) {
    const lang = resolveLang(langParam);
    const products = await this.prisma.product.findMany({
      where: { ...this.publicWhere(), weeklyDeal: true },
      include: this.productInclude(),
      orderBy: { discountPct: 'desc' },
    });
    return products.map((product) => this.mapProduct(product, lang));
  }

  async findBestsellers(limit = 10, langParam?: string) {
    const lang = resolveLang(langParam);
    const products = await this.prisma.product.findMany({
      where: this.publicWhere(),
      include: this.productInclude(),
      orderBy: [{ soldCount: 'desc' }, { title: 'asc' }],
      take: limit,
    });
    return products.map((product) => this.mapProduct(product, lang));
  }

  async findBySlug(slug: string, langParam?: string) {
    const lang = resolveLang(langParam);
    const product = await this.prisma.product.findFirst({
      where: { slug, ...this.publicWhere() },
      include: this.productInclude(),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.mapProduct(product, lang);
  }
}
