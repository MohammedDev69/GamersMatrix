import { Module } from '@nestjs/common';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [CampaignsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
