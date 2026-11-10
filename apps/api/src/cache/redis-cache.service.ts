import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryEntry = { value: string; expiresAt: number };

/** Cap for the in-memory fallback so a Redis outage cannot OOM the process. */
const MEMORY_CACHE_MAX_ENTRIES = 10_000;

/**
 * Redis-backed cache with in-memory fallback when Redis is unavailable.
 * Safe for local development without Docker Redis.
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis | null = null;
  private readonly memory = new Map<string, MemoryEntry>();
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url =
      this.config.get<string>('REDIS_URL')?.trim() ||
      'redis://127.0.0.1:6379';
    const disabled =
      this.config.get<string>('REDIS_DISABLED') === 'true' ||
      this.config.get<string>('REDIS_DISABLED') === '1';

    if (disabled) {
      this.logger.warn('Redis disabled — using in-memory cache only');
      return;
    }

    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy: () => null,
      lazyConnect: true,
    });

    client.on('error', (err) => {
      if (this.enabled) {
        this.logger.warn(`Redis error: ${err.message}`);
      }
    });

    try {
      await client.connect();
      await client.ping();
      this.redis = client;
      this.enabled = true;
      this.logger.log('Redis cache connected');
    } catch (err) {
      this.logger.warn(
        `Redis unavailable — falling back to memory cache (${err instanceof Error ? err.message : 'unknown'})`,
      );
      try {
        client.disconnect();
      } catch {
        /* ignore */
      }
      this.redis = null;
      this.enabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
      this.redis = null;
    }
    this.memory.clear();
  }

  get backend(): 'redis' | 'memory' {
    return this.enabled && this.redis ? 'redis' : 'memory';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis && this.enabled) {
        const raw = await this.redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      this.logger.debug(
        `Redis get failed for ${key}: ${err instanceof Error ? err.message : 'error'}`,
      );
    }

    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      this.memory.delete(key);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const raw = JSON.stringify(value);
    const ttl = Math.max(1, Math.floor(ttlSeconds));

    try {
      if (this.redis && this.enabled) {
        await this.redis.set(key, raw, 'EX', ttl);
        return;
      }
    } catch (err) {
      this.logger.debug(
        `Redis set failed for ${key}: ${err instanceof Error ? err.message : 'error'}`,
      );
    }

    this.evictMemoryIfFull();
    this.memory.set(key, {
      value: raw,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /** FIFO eviction: drop the ~10% oldest entries when the cap is reached. */
  private evictMemoryIfFull(): void {
    if (this.memory.size < MEMORY_CACHE_MAX_ENTRIES) return;
    const evictCount = Math.ceil(MEMORY_CACHE_MAX_ENTRIES / 10);
    let i = 0;
    for (const key of this.memory.keys()) {
      this.memory.delete(key);
      if (++i >= evictCount) break;
    }
  }

  async del(key: string): Promise<void> {
    this.memory.delete(key);
    try {
      if (this.redis && this.enabled) await this.redis.del(key);
    } catch {
      /* ignore */
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of [...this.memory.keys()]) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }

    if (!this.redis || !this.enabled) return;

    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      this.logger.debug(
        `Redis prefix delete failed for ${prefix}: ${err instanceof Error ? err.message : 'error'}`,
      );
    }
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) return cached;
    const value = await loader();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /** Bust all public catalog caches after admin mutations. */
  async invalidateCatalog(): Promise<void> {
    await Promise.all([
      this.delByPrefix('gm:products:'),
      this.delByPrefix('gm:product:'),
      this.delByPrefix('gm:categories:'),
    ]);
  }

  async invalidateStore(): Promise<void> {
    await this.delByPrefix('gm:store:');
  }
}
