import { SetMetadata } from '@nestjs/common';

export const HTTP_CACHE_KEY = 'http-cache';

/**
 * Decorator to enable HTTP caching with specific max-age
 * @param maxAge - Cache duration in seconds
 * @param isPrivate - Whether cache should be private (default: false/public)
 */
export const HttpCache = (maxAge: number, isPrivate = false) => {
  return SetMetadata(HTTP_CACHE_KEY, { maxAge, isPrivate });
};

/**
 * Decorator to disable HTTP caching
 */
export const NoCache = () => {
  return SetMetadata(HTTP_CACHE_KEY, { maxAge: 0, noCache: true });
};
