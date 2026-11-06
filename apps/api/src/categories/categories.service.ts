import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { localizeCategory, resolveLang } from '../common/serialize';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(langParam?: string) {
    const lang = resolveLang(langParam);
    const categories = await this.prisma.category.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            products: {
              where: { active: true, publicationStatus: 'PUBLISHED' },
            },
          },
        },
      },
    });

    return categories.map((category) => ({
      ...localizeCategory(category, lang),
      productsCount: category._count.products,
    }));
  }
}
