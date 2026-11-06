import { Controller, Get } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get('public-config')
  getPublicConfig() {
    return this.store.getPublicConfig();
  }
}
