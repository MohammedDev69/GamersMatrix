import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';

/**
 * Sets short public Cache-Control on catalog reads so CDN/browsers can reuse.
 * Auth/cart/admin routes stay uncached.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ method?: string; path?: string; url?: string }>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if ((req.method || 'GET').toUpperCase() !== 'GET') return;
        const path = req.path || req.url || '';
        if (
          path.startsWith('/products') ||
          path.startsWith('/categories') ||
          path.startsWith('/store/public-config')
        ) {
          const maxAge = path.startsWith('/store/') ? 120 : 45;
          res.setHeader(
            'Cache-Control',
            `public, max-age=${maxAge}, stale-while-revalidate=60`,
          );
        } else if (
          path.startsWith('/admin') ||
          path.startsWith('/cart') ||
          path.startsWith('/auth') ||
          path.startsWith('/orders') ||
          path.startsWith('/wishlist') ||
          path.startsWith('/checkout')
        ) {
          res.setHeader('Cache-Control', 'no-store');
        }
      }),
    );
  }
}
