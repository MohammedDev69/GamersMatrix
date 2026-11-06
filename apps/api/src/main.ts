import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const env = process.env.NODE_ENV || 'development';
  const logger = new Logger('Bootstrap');

  const jwtSecret = process.env.JWT_SECRET || '';
  if (env === 'production' && jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters in production',
    );
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

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Bearer JWT is sent via Authorization header — credentials cookies not required.
  app.enableCors({
    origin: frontendUrl,
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'hmac'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port);

  logger.log('────────────────────────────────────────');
  logger.log('  Gamers Matrix API');
  logger.log(`  URL:  http://localhost:${port}`);
  logger.log(`  CORS: ${frontendUrl}`);
  logger.log(`  ENV:  ${env}`);
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
