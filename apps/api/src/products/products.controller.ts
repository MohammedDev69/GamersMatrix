import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('weeklyDeal') weeklyDeal?: string,
    @Query('search') search?: string,
    @Query('kind') kind?: string,
    @Query('platform') platform?: string,
    @Query('bestsellers') bestsellers?: string,
    @Query('popular') popular?: string,
    @Query('hot') hot?: string,
    @Query('isNew') isNew?: string,
    @Query('lang') lang?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.productsService.findAll({
      category,
      featured,
      weeklyDeal,
      search,
      kind,
      platform,
      bestsellers,
      popular,
      hot,
      isNew,
      lang,
      limit,
      sort,
    });
  }

  @Get('featured')
  findFeatured(@Query('lang') lang?: string) {
    return this.productsService.findFeatured(lang);
  }

  @Get('weekly-deal')
  findWeeklyDeal(@Query('lang') lang?: string) {
    return this.productsService.findWeeklyDeal(lang);
  }

  @Get('bestsellers')
  findBestsellers(
    @Query('limit') limit?: string,
    @Query('lang') lang?: string,
  ) {
    const n = limit ? Number(limit) : 10;
    return this.productsService.findBestsellers(
      Number.isFinite(n) && n > 0 ? Math.min(n, 24) : 10,
      lang,
    );
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @Query('lang') lang?: string) {
    return this.productsService.findBySlug(slug, lang);
  }
}
