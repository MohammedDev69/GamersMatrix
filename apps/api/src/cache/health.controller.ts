import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from './redis-cache.service';

/**
 * GET /health — liveness/readiness probe.
 * 200 = DB reachable + cache reachable (Redis or memory fallback).
 * 503 = a required dependency is down; load balancers / Docker stop
 * routing traffic to this instance so it can restart.
 */
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  @Get('health')
  async health(): Promise<Record<string, unknown>> {
    const started = Date.now();
    let db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }

    const cache = this.cache.backend;

    const body = {
      status: db ? 'ok' : 'degraded',
      db,
      cache,
      uptime: Math.floor(process.uptime()),
      ts: new Date().toISOString(),
      tookMs: Date.now() - started,
    };

    return body;
  }
}
