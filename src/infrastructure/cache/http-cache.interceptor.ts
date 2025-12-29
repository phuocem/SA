import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import etag from 'etag';
import { HTTP_CACHE_KEY } from './http-cache.decorator';

/**
 * HTTP Caching Interceptor with ETag support
 * Adds ETag and Cache-Control headers to responses
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get cache metadata from decorator
    const cacheMetadata = this.reflector.get<{
      maxAge?: number;
      isPrivate?: boolean;
      noCache?: boolean;
    }>(HTTP_CACHE_KEY, context.getHandler());

    return next.handle().pipe(
      map((data) => {
        // Only cache GET requests
        if (request.method !== 'GET') {
          return data;
        }

        // Check if caching is disabled via @NoCache()
        if (cacheMetadata?.noCache) {
          response.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
          response.setHeader('Pragma', 'no-cache');
          response.setHeader('Expires', '0');
          return data;
        }

        // Skip ETag for null/undefined responses
        if (!data) {
          return data;
        }

        // Generate ETag from response data
        const responseBody = JSON.stringify(data);
        const responseETag = etag(responseBody);

        // Check if client has valid cached version
        const clientETag = request.headers['if-none-match'];
        if (clientETag === responseETag) {
          // Client has valid cache, return 304 Not Modified
          response.status(304);
          return null;
        }

        // Set ETag header
        response.setHeader('ETag', responseETag);

        // Set Cache-Control based on decorator or URL pattern
        const cacheControl = this.getCacheControl(request.url, cacheMetadata);
        response.setHeader('Cache-Control', cacheControl);

        // Add Last-Modified header
        response.setHeader('Last-Modified', new Date().toUTCString());

        // Add Vary header for content negotiation
        response.setHeader('Vary', 'Accept-Encoding');

        return data;
      }),
    );
  }

  /**
   * Determine Cache-Control header based on decorator metadata or URL pattern
   */
  private getCacheControl(
    url: string,
    metadata?: { maxAge?: number; isPrivate?: boolean },
  ): string {
    // Use decorator metadata if provided
    if (metadata?.maxAge !== undefined) {
      const visibility = metadata.isPrivate ? 'private' : 'public';
      return `${visibility}, max-age=${metadata.maxAge}, must-revalidate`;
    }

    // Fallback to URL pattern matching
    // Public, frequently changing data (1 minute)
    if (url.includes('/registrations')) {
      return 'public, max-age=60, must-revalidate';
    }

    // Public, moderately changing data (5 minutes)
    if (url.includes('/events')) {
      return 'public, max-age=300, must-revalidate';
    }

    // Public, rarely changing data (10 minutes)
    if (url.includes('/roles')) {
      return 'public, max-age=600, must-revalidate';
    }

    // Private data (user-specific)
    if (url.includes('/users/me') || url.includes('/auth')) {
      return 'private, no-cache, no-store, must-revalidate';
    }

    // Default: moderate caching
    return 'public, max-age=180, must-revalidate';
  }
}
