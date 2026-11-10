import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductKind, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import {
  CacheTTL,
  productDetailKey,
  productsListKey,
} from '../cache/cache-keys';
import { Lang, resolveLang, serializePublicProduct } from '../common/serialize';
import { parsePage, pageMeta } from '../common/pagination';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Ratings are aggregated with ONE groupBy query per response instead of
   * including every review row for every listed product. The old include made
   * a catalog response grow with the total number of reviews in the store.
   */
  private async ratingSummary(productIds: string[]) {
    const summary = new Map<string, { avg: number | null; count: number }>();
    if (productIds.length === 0) return summary;

    const rows = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    for (const row of rows) {
      summary.set(row.productId, {
        avg: row._avg.rating,
        count: row._count._all,
      });
    }
    return summary;
  }

  private mapProduct<
    T extends {
      id?: string;
      _count?: { keys?: number };
      [key: string]: unknown;
    },
  >(
    product: T,
    lang: Lang,
    ratings?: Map<string, { avg: number | null; count: number }>,
    lean = false,
  ) {
    const { _count, ...rest } = product;
    const rating = ratings?.get(product.id ?? '');
    const serialized = serializePublicProduct(rest, lang);

    if (lean) {
      // Card/list payload: cards only render a short blurb, while the long
      // description and SEO fields are only needed on the detail page.
      const description = serialized.description;
      if (typeof description === 'string' && description.length > 180) {
        serialized.description = `${description.slice(0, 177).trimEnd()}...`;
      }
      delete serialized.seoTitle;
      delete serialized.seoDescription;
      delete serialized.ogImageUrl;
    }

    return {
      ...serialized,
      // Boolean availability only — never expose raw key codes publicly
      inStock: (_count?.keys ?? 0) > 0,
      stock: _count?.keys ?? 0,
      availableKeys: _count?.keys ?? 0,
      reviewCount: rating?.count ?? 0,
      avgRating:
        rating?.avg != null ? Math.round(rating.avg * 10) / 10 : null,
    };
  }

  private productInclude() {
    return {
      category: true,
      _count: {
        select: {
          keys: { where: { status: 'AVAILABLE' as const } },
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
    const cacheKey = productsListKey({
      category: query.category,
      featured: query.featured,
      weeklyDeal: query.weeklyDeal,
      search: query.search,
      kind: query.kind,
      platform: query.platform,
      bestsellers: query.bestsellers,
      popular: query.popular,
      hot: query.hot,
      isNew: query.isNew,
      lang: query.lang,
      limit: query.limit,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });

    return this.cache.getOrSet(cacheKey, CacheTTL.PRODUCTS_LIST, () =>
      this.findAllUncached(query),
    );
  }

  private async findAllUncached(query: {
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
      const ratings = await this.ratingSummary(products.map((p) => p.id));
      return products.map((product) =>
        this.mapProduct(product, lang, ratings, true),
      );
    }

    const { page, pageSize, skip, take } = parsePage(query);
    // Read-only queries run in parallel on the connection pool; $transaction
    // forces them onto a single connection and serializes them.
    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: this.productInclude(),
        orderBy,
        skip,
        take,
      }),
    ]);
    const ratings = await this.ratingSummary(products.map((p) => p.id));

    // Backward-compatible: when no page param, return array only via legacy path above.
    // With page/pageSize, return envelope.
    if (query.page || query.pageSize) {
      return {
        items: products.map((product) =>
          this.mapProduct(product, lang, ratings, true),
        ),
        meta: pageMeta(total, page, pageSize),
      };
    }

    return products.map((product) =>
      this.mapProduct(product, lang, ratings, true),
    );
  }

  async findFeatured(langParam?: string) {
    const lang = resolveLang(langParam);
    return this.cache.getOrSet(
      productsListKey({ featured: 'true', lang }),
      CacheTTL.PRODUCTS_LIST,
      async () => {
        const products = await this.prisma.product.findMany({
          where: { ...this.publicWhere(), featured: true },
          include: this.productInclude(),
          orderBy: { title: 'asc' },
        });
        const ratings = await this.ratingSummary(products.map((p) => p.id));
        return products.map((product) =>
          this.mapProduct(product, lang, ratings, true),
        );
      },
    );
  }

  async findWeeklyDeal(langParam?: string) {
    const lang = resolveLang(langParam);
    return this.cache.getOrSet(
      productsListKey({ weeklyDeal: 'true', lang }),
      CacheTTL.PRODUCTS_LIST,
      async () => {
        const products = await this.prisma.product.findMany({
          where: { ...this.publicWhere(), weeklyDeal: true },
          include: this.productInclude(),
          orderBy: { discountPct: 'desc' },
        });
        const ratings = await this.ratingSummary(products.map((p) => p.id));
        return products.map((product) =>
          this.mapProduct(product, lang, ratings, true),
        );
      },
    );
  }

  async findBestsellers(limit = 10, langParam?: string) {
    const lang = resolveLang(langParam);
    return this.cache.getOrSet(
      productsListKey({ bestsellers: 'true', limit: String(limit), lang }),
      CacheTTL.PRODUCTS_LIST,
      async () => {
        const products = await this.prisma.product.findMany({
          where: this.publicWhere(),
          include: this.productInclude(),
          orderBy: [{ soldCount: 'desc' }, { title: 'asc' }],
          take: limit,
        });
        const ratings = await this.ratingSummary(products.map((p) => p.id));
        return products.map((product) =>
          this.mapProduct(product, lang, ratings, true),
        );
      },
    );
  }

  async findBySlug(slug: string, langParam?: string) {
    const lang = resolveLang(langParam);
    return this.cache.getOrSet(
      productDetailKey(slug, lang),
      CacheTTL.PRODUCT_DETAIL,
      async () => {
        const product = await this.prisma.product.findFirst({
          where: { slug, ...this.publicWhere() },
          include: this.productInclude(),
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        const ratings = await this.ratingSummary([product.id]);
        return this.mapProduct(product, lang, ratings);
      },
    );
  }
}
