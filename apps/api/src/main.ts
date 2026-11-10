import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { RedisCacheService } from './cache/redis-cache.service';

async function bootstrap() {
  const env = process.env.NODE_ENV || 'development';
  const logger = new Logger('Bootstrap');

  if (env === 'production' && !process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL is required in production');
  }

  // Explicit Express adapter — avoids Nest PackageLoader failing in npm workspaces
  // when @nestjs/core is hoisted to the monorepo root and platform-express is not.
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    {
      logger:
        env === 'production'
          ? ['error', 'warn', 'log']
          : ['error', 'warn', 'log', 'debug', 'verbose'],
    },
  );

  app.use(
    helmet({
      contentSecurityPolicy: false, // API is JSON; CSP belongs on the web app
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Gzip responses when the client asks for it (catalog lists compress ~70%).
  app.use(compression());

  // Behind Nginx / a reverse proxy / CDN: trust the first hop so
  // req.ip (used by the throttler) reflects the real client, not the proxy.
  const trustProxy = process.env.TRUST_PROXY === 'true';
  if (trustProxy)
    (app.getHttpAdapter().getInstance() as { set?: (key: string, value: unknown) => void }).set?.('trust proxy', 1);

  // FRONTEND_URL accepts comma-separated origins in production
  // (e.g. apex + www, or a preview domain).
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origins = frontendUrl
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Supabase access tokens are sent via Authorization; API cookies are not used.
  app.enableCors({
    origin: origins,
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'hmac'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Never leak whitelist/validator internals to outside users.
      disableErrorMessages: env === 'production',
    }),
  );

  // SIGTERM/SIGINT run OnModuleDestroy (Redis quit, Prisma disconnect, DB writes flush)
  // instead of killing the process mid-request. Required for Docker/PM2/K8s.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port);

  const redisUrl = process.env.REDIS_URL?.trim() || 'redis://127.0.0.1:6379';
  const cacheBackend = app.get(RedisCacheService).backend;

  logger.log('────────────────────────────────────────');
  logger.log('  Gamers Matrix API');
  logger.log(`  URL:  http://localhost:${port}`);
  logger.log(`  CORS: ${origins.join(', ')}`);
  logger.log(`  ENV:  ${env}`);
  logger.log(
    `  Cache: ${
      process.env.REDIS_DISABLED === 'true' || process.env.REDIS_DISABLED === '1'
        ? 'memory (REDIS_DISABLED)'
        : `Redis → ${redisUrl} (active: ${cacheBackend}, memory fallback)`
    }`,
  );
  logger.log('────────────────────────────────────────');
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Failed to start API',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
