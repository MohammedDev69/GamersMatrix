import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
  ProductKind,
  PublicationStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  serializeAdminProduct,
  serializeProduct,
  toNumber,
} from '../common/serialize';
import { assertPublicationTransition } from '../common/publication';
import { AuditService } from '../audit/audit.service';
import {
  AddKeysDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateOrderStatusDto,
} from './dto/admin-extra.dto';
import { TransitionPublicationDto } from './dto/publication.dto';
import { PaymentsService } from '../payments/payments.service';
import { RedisCacheService } from '../cache/redis-cache.service';

function parseKind(value?: string | null): ProductKind | undefined {
  if (!value) return undefined;
  const kind = value.toUpperCase();
  if (Object.values(ProductKind).includes(kind as ProductKind)) {
    return kind as ProductKind;
  }
  return undefined;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly payments: PaymentsService,
    private readonly cache: RedisCacheService,
  ) {}

  private async bustCatalogCache() {
    await this.cache.invalidateCatalog();
  }

  async getStats() {
    const [
      products,
      activeProducts,
      orders,
      paidOrders,
      pendingOrders,
      failedFulfillment,
      categories,
      availableKeys,
      revenue,
      pendingContent,
      scheduledContent,
      failedSchedules,
      latestOrders,
      lowStock,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({
        where: {
          active: true,
          publicationStatus: PublicationStatus.PUBLISHED,
        },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({
        where: { fulfillmentStatus: 'FAILED' },
      }),
      this.prisma.category.count(),
      this.prisma.productKey.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.PAID },
        _sum: { totalEGP: true },
      }),
      this.prisma.contentPage.count({
        where: {
          publicationStatus: {
            in: [PublicationStatus.DRAFT, PublicationStatus.IN_REVIEW],
          },
        },
      }),
      this.prisma.contentPage.count({
        where: { publicationStatus: PublicationStatus.SCHEDULED },
      }),
      this.prisma.contentPage.count({
        where: {
          publicationStatus: PublicationStatus.SCHEDULED,
          scheduleError: { not: null },
        },
      }),
      this.prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          fulfillmentStatus: true,
          totalEGP: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      this.prisma.product.findMany({
        where: {
          kind: ProductKind.GAME_KEY,
          publicationStatus: {
            in: [PublicationStatus.PUBLISHED, PublicationStatus.SCHEDULED],
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          keys: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
            take: 6,
          },
        },
        take: 40,
      }),
    ]);

    const inventoryWarnings = lowStock
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        availableKeys: p.keys.length,
      }))
      .filter((p) => p.availableKeys < 5)
      .slice(0, 10);

    return {
      products,
      activeProducts,
      orders,
      paidOrders,
      pendingOrders,
      failedFulfillment,
      categories,
      availableKeys,
      revenueEGP: toNumber(revenue._sum.totalEGP) ?? 0,
      pendingContent,
      scheduledContent,
      failedSchedules,
      latestOrders: latestOrders.map((o) => ({
        ...o,
        totalEGP: toNumber(o.totalEGP) ?? 0,
      })),
      inventoryWarnings,
    };
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      sortOrder: c.sortOrder,
      visible: c.visible,
      productsCount: c._count.products,
      createdAt: c.createdAt,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      const created = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description ?? null,
          icon: dto.icon ?? null,
          sortOrder: dto.sortOrder ?? 0,
          visible: dto.visible ?? true,
        },
      });
      await this.bustCatalogCache();
      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category slug already exists');
      }
      throw error;
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          icon: dto.icon,
          sortOrder: dto.sortOrder,
          visible: dto.visible,
        },
      });
      await this.bustCatalogCache();
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category slug already exists');
      }
      throw error;
    }
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) throw new NotFoundException('Category not found');
    if (existing._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category with products. Move or delete products first.',
      );
    }
    await this.prisma.category.delete({ where: { id } });
    await this.bustCatalogCache();
    return { deleted: true, id };
  }

  async deleteKey(keyId: string) {
    const key = await this.prisma.productKey.findUnique({
      where: { id: keyId },
    });
    if (!key) throw new NotFoundException('Key not found');
    if (key.status === 'DELIVERED' || key.orderItemId) {
      throw new BadRequestException('Cannot delete a delivered key');
    }
    await this.prisma.productKey.delete({ where: { id: keyId } });
    return { deleted: true, id: keyId };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Order not found');

    const status = dto.status.toUpperCase();
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException('Invalid order status');
    }

    await this.prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    });

    return this.getOrder(id);
  }

  async reconcileFulfillment(id: string) {
    return this.payments.reconcileFulfillment(id);
  }

  async listProducts(opts?: {
    q?: string;
    categoryId?: string;
    status?: PublicationStatus;
    kind?: ProductKind;
    page?: number;
    pageSize?: number;
  }) {
    const page = opts?.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts?.pageSize && opts.pageSize > 0
        ? Math.min(opts.pageSize, 100)
        : 20;
    const where: Prisma.ProductWhereInput = {};
    if (opts?.q?.trim()) {
      const q = opts.q.trim();
      where.OR = [
        { title: { contains: q } },
        { slug: { contains: q } },
        { platform: { contains: q } },
      ];
    }
    if (opts?.categoryId) where.categoryId = opts.categoryId;
    if (opts?.status) where.publicationStatus = opts.status;
    if (opts?.kind) where.kind = opts.kind;

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: true,
          _count: { select: { keys: true, media: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // One aggregate query for the whole page instead of one count per product.
    const availableRows = await this.prisma.productKey.groupBy({
      by: ['productId'],
      where: {
        productId: { in: products.map((p) => p.id) },
        status: 'AVAILABLE',
      },
      _count: { _all: true },
    });
    const availableByProduct = new Map(
      availableRows.map((row) => [row.productId, row._count._all]),
    );

    const items = products.map((product) => ({
      ...serializeAdminProduct(product),
      keysTotal: product._count.keys,
      mediaCount: product._count.media,
      stock: availableByProduct.get(product.id) ?? 0,
      variants: product.variants.map((v) => ({
        ...v,
        priceEGP: toNumber(v.priceEGP) ?? 0,
      })),
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  }

  async createProduct(dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          title: dto.title,
          titleEn: dto.titleEn ?? null,
          slug: dto.slug,
          description: dto.description,
          descriptionEn: dto.descriptionEn ?? null,
          imageUrl: dto.imageUrl,
          platform: dto.platform,
          region: dto.region ?? null,
          currencyCode: dto.currencyCode ?? 'EGP',
          priceEGP: new Prisma.Decimal(dto.priceEGP),
          originalPrice:
            dto.originalPrice != null
              ? new Prisma.Decimal(dto.originalPrice)
              : null,
          discountPct: dto.discountPct ?? null,
          featured: dto.featured ?? false,
          weeklyDeal: dto.weeklyDeal ?? false,
          hot: dto.hot ?? false,
          isNew: dto.isNew ?? false,
          active: dto.active ?? true,
          publicationStatus: PublicationStatus.DRAFT,
          seoTitle: dto.seoTitle ?? null,
          seoDescription: dto.seoDescription ?? null,
          ogImageUrl: dto.ogImageUrl ?? null,
          internalNotes: dto.internalNotes ?? null,
          kind: parseKind(dto.kind) ?? ProductKind.GAME_KEY,
          deliveryNote: dto.deliveryNote ?? null,
          deliveryNoteEn: dto.deliveryNoteEn ?? null,
          categoryId: dto.categoryId,
        },
        include: { category: true },
      });

      await this.prisma.publicationRevision.create({
        data: {
          entityType: 'product',
          entityId: product.id,
          snapshot: product,
          note: 'Created as draft',
        },
      });

      await this.bustCatalogCache();
      return serializeAdminProduct(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product slug already exists');
      }
      throw error;
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          title: dto.title,
          titleEn: dto.titleEn,
          slug: dto.slug,
          description: dto.description,
          descriptionEn: dto.descriptionEn,
          imageUrl: dto.imageUrl,
          platform: dto.platform,
          region: dto.region,
          currencyCode: dto.currencyCode,
          priceEGP:
            dto.priceEGP != null ? new Prisma.Decimal(dto.priceEGP) : undefined,
          originalPrice:
            dto.originalPrice === null
              ? null
              : dto.originalPrice != null
                ? new Prisma.Decimal(dto.originalPrice)
                : undefined,
          discountPct: dto.discountPct,
          featured: dto.featured,
          weeklyDeal: dto.weeklyDeal,
          hot: dto.hot,
          isNew: dto.isNew,
          active: dto.active,
          kind: parseKind(dto.kind),
          deliveryNote: dto.deliveryNote,
          deliveryNoteEn: dto.deliveryNoteEn,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          ogImageUrl: dto.ogImageUrl,
          internalNotes: dto.internalNotes,
          categoryId: dto.categoryId,
        },
        include: { category: true },
      });

      await this.prisma.publicationRevision.create({
        data: {
          entityType: 'product',
          entityId: id,
          snapshot: {
            slug: product.slug,
            title: product.title,
            publicationStatus: product.publicationStatus,
          },
          note: 'Product save',
        },
      });

      await this.bustCatalogCache();
      return serializeAdminProduct(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product slug already exists');
      }
      throw error;
    }
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });
    await this.bustCatalogCache();
    return { deleted: true, id };
  }

  async addKeys(productId: string, dto: AddKeysDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const codes = [
      ...new Set(
        dto.codes.map((code) => code.trim()).filter((code) => code.length > 0),
      ),
    ];

    if (codes.length === 0) {
      throw new BadRequestException('No valid codes provided');
    }

    try {
      const result = await this.prisma.productKey.createMany({
        data: codes.map((code) => ({
          code,
          productId,
          status: 'AVAILABLE',
        })),
      });

      await this.bustCatalogCache();
      return {
        productId,
        requested: codes.length,
        created: result.count,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('One or more codes already exist');
      }
      throw error;
    }
  }

  async listKeys(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.productKey.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItem: {
          select: {
            id: true,
            orderId: true,
          },
        },
      },
    });
  }

  async listOrders(q?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { id: { contains: term } },
        { orderNumber: { contains: term } },
        { user: { email: { contains: term } } },
        { user: { name: { contains: term } } },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: {
            productKey: true,
            product: {
              select: {
                id: true,
                title: true,
                titleEn: true,
                slug: true,
                imageUrl: true,
                platform: true,
                priceEGP: true,
                currencyCode: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return orders.map((order) => ({
      ...order,
      totalEGP: toNumber(order.totalEGP) ?? 0,
      items: order.items.map((item) => ({
        ...item,
        unitPriceEGP: toNumber(item.unitPriceEGP) ?? 0,
        product: serializeProduct(item.product),
        // Generic order tables never expose raw digital keys
        productKey: item.productKey
          ? {
              id: item.productKey.id,
              status: item.productKey.status,
              code: null,
              redacted: true,
            }
          : null,
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            status: order.payment.status,
            amountEGP: toNumber(order.payment.amountEGP) ?? 0,
            currencyCode: order.payment.currencyCode,
            transactionId: order.payment.transactionId,
            // rawPayload intentionally omitted from list
          }
        : null,
    }));
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: {
            productKey: true,
            product: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      ...order,
      totalEGP: toNumber(order.totalEGP) ?? 0,
      items: order.items.map((item) => ({
        ...item,
        unitPriceEGP: toNumber(item.unitPriceEGP) ?? 0,
        product: serializeProduct(item.product),
        productKey: item.productKey
          ? {
              id: item.productKey.id,
              status: item.productKey.status,
              code: null,
              redacted: true,
            }
          : null,
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            status: order.payment.status,
            amountEGP: toNumber(order.payment.amountEGP) ?? 0,
            currencyCode: order.payment.currencyCode,
            transactionId: order.payment.transactionId,
            // secrets / raw provider payload never returned
          }
        : null,
    };
  }

  async listCustomers(q?: string, page = 1, pageSize = 20) {
    const where: Prisma.UserWhereInput = {
      role: Role.USER,
    };
    if (q?.trim()) {
      where.OR = [
        { email: { contains: q.trim() } },
        { name: { contains: q.trim() } },
      ];
    }
    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: Math.min(pageSize, 100),
      }),
    ]);
    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
        ordersCount: u._count.orders,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getCustomer(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.USER },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        orders: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            fulfillmentStatus: true,
            totalEGP: true,
            createdAt: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Customer not found');
    return {
      ...user,
      orders: user.orders.map((o) => ({
        ...o,
        totalEGP: toNumber(o.totalEGP) ?? 0,
      })),
    };
  }

  async listAdminUsers() {
    return this.prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.EDITOR] } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateUserRole(
    id: string,
    role: Role,
    actorId?: string,
  ) {
    if (role === Role.USER) {
      throw new BadRequestException('Use demote carefully — not supported here');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === actorId && role !== Role.ADMIN) {
      throw new BadRequestException('Cannot remove your own ADMIN role');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    await this.audit.log({
      actorId,
      action: 'user.role.update',
      entityType: 'user',
      entityId: id,
      summary: `${user.role} → ${role}`,
      metadata: { before: user.role, after: role },
    });
    return updated;
  }

  async updateStoreSettings(
    data: {
      storeName?: string;
      defaultLocale?: string;
      currencyCode?: string;
      timezone?: string;
      supportWhatsApp?: string | null;
      supportEmail?: string | null;
      publicNotice?: string | null;
      seoTitleDefault?: string | null;
      seoDescriptionDefault?: string | null;
    },
    actorId?: string,
  ) {
    const settings = await this.prisma.storeSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        storeName: data.storeName ?? 'Gamers Matrix',
        defaultLocale: data.defaultLocale ?? 'ar',
        currencyCode: data.currencyCode ?? 'EGP',
        timezone: data.timezone ?? 'Africa/Cairo',
        supportWhatsApp: data.supportWhatsApp ?? null,
        supportEmail: data.supportEmail ?? null,
        publicNotice: data.publicNotice ?? null,
        seoTitleDefault: data.seoTitleDefault ?? null,
        seoDescriptionDefault: data.seoDescriptionDefault ?? null,
      },
      update: {
        storeName: data.storeName,
        defaultLocale: data.defaultLocale,
        currencyCode: data.currencyCode,
        timezone: data.timezone,
        supportWhatsApp: data.supportWhatsApp,
        supportEmail: data.supportEmail,
        publicNotice: data.publicNotice,
        seoTitleDefault: data.seoTitleDefault,
        seoDescriptionDefault: data.seoDescriptionDefault,
      },
    });
    await this.audit.log({
      actorId,
      action: 'settings.update',
      entityType: 'store_settings',
      entityId: 'default',
      summary: 'Updated store settings',
      metadata: { ...data },
    });
    await this.cache.invalidateStore();
    return settings;
  }

  async transitionProductPublication(
    id: string,
    dto: TransitionPublicationDto,
    actorId?: string,
  ) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    assertPublicationTransition(existing.publicationStatus, dto.status);

    if (dto.status === PublicationStatus.SCHEDULED && !dto.scheduledAt) {
      throw new BadRequestException(
        'scheduledAt is required when status is SCHEDULED',
      );
    }

    if (
      dto.status === PublicationStatus.PUBLISHED &&
      (!existing.title?.trim() ||
        !existing.description?.trim() ||
        !existing.imageUrl?.trim())
    ) {
      throw new BadRequestException(
        'Cannot publish: title, description, and imageUrl are required',
      );
    }

    const scheduledAt =
      dto.status === PublicationStatus.SCHEDULED
        ? new Date(dto.scheduledAt!)
        : dto.status === PublicationStatus.PUBLISHED
          ? null
          : existing.scheduledAt;

    const publishedAt =
      dto.status === PublicationStatus.PUBLISHED
        ? (existing.publishedAt ?? new Date())
        : existing.publishedAt;

    const product = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          publicationStatus: dto.status,
          scheduledAt,
          publishedAt,
          scheduleError: null,
          active:
            dto.status === PublicationStatus.PUBLISHED ? true : existing.active,
        },
        include: { category: true },
      });

      await tx.publicationRevision.create({
        data: {
          entityType: 'product',
          entityId: id,
          editorId: actorId ?? null,
          note:
            dto.note ??
            `Transition ${existing.publicationStatus} → ${dto.status}`,
          snapshot: {
            publicationStatus: updated.publicationStatus,
            scheduledAt: updated.scheduledAt,
            publishedAt: updated.publishedAt,
            slug: updated.slug,
          },
        },
      });

      return updated;
    });

    await this.audit.log({
      actorId,
      action: 'product.publication.transition',
      entityType: 'product',
      entityId: id,
      summary: `${existing.publicationStatus} → ${dto.status}`,
      metadata: { from: existing.publicationStatus, to: dto.status },
    });

    await this.bustCatalogCache();
    return serializeAdminProduct(product);
  }

  async listAuditLogs(page = 1, pageSize = 30) {
    const skip = (page - 1) * pageSize;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          actor: { select: { id: true, email: true, name: true, role: true } },
        },
      }),
    ]);
    return { items, total, page, pageSize };
  }

  async getStoreSettings() {
    return this.prisma.storeSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
  }

  async ensureSlugAvailable(slug: string, excludeProductId?: string) {
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeProductId) {
      throw new ConflictException('Product slug already exists');
    }
    return { available: true, slug };
  }
}
