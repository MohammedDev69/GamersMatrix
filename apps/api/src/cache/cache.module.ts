import { Global, Controller, Get, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { HealthController } from './health.controller';

@Global()
@Module({
  controllers: [HealthController],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
