import { Module } from '@nestjs/common';
import { PublishingScheduler } from './publishing.scheduler';
import { PublishingController } from './publishing.controller';

@Module({
  controllers: [PublishingController],
  providers: [PublishingScheduler],
  exports: [PublishingScheduler],
})
export class PublishingModule {}
