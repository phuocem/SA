import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Decorator to enable caching on a method
 * @param key - Cache key or key generator function
 * @param ttl - Time to live in milliseconds (optional)
 */
export const CacheKey = (key: string | ((...args: any[]) => string), ttl?: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    if (ttl) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};

/**
 * Decorator to invalidate cache on method execution
 * @param keys - Cache keys to invalidate
 */
export const CacheEvict = (...keys: string[]) => {
  return SetMetadata('cache:evict', keys);
};
