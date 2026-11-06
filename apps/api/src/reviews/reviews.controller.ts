import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('summary')
  getSummary() {
    return this.reviewsService.getSummary();
  }

  @Get('recent')
  findRecent(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 12;
    return this.reviewsService.findRecent(Number.isFinite(n) && n > 0 ? n : 12);
  }

  @Get('product/:productId')
  findByProduct(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    const n = limit ? Number(limit) : 20;
    return this.reviewsService.findByProduct(
      productId,
      Number.isFinite(n) && n > 0 ? n : 20,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewsService.remove(user.id, id);
  }
}
