import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.logger.debug(`Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache with TTL (milliseconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      const ttlLabel = ttl === undefined ? 'default' : `${ttl}ms`;
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttlLabel})`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const cacheStore = (this.cacheManager as any).store;
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

      let keys: string[] = [];
      if (cacheStore?.keys) {
        keys = await cacheStore.keys();
      } else if (cacheStore?.store?.keys) {
        keys = await cacheStore.store.keys();
      } else if (cacheStore?.data) {
        keys = Object.keys(cacheStore.data);
      }

      const matched = keys.filter((k) => regex.test(k));
      for (const k of matched) {
        await this.cacheManager.del(k);
        this.logger.debug(`Cache DEL: ${k}`);
      }

      this.logger.debug(`Cache DEL pattern: ${pattern} (matched ${matched.length})`);
    } catch (error) {
      this.logger.error(`Cache DEL pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Clear entire cache
   */
  async reset(): Promise<void> {
    try {
      // Cache manager may not expose reset, this is a best-effort attempt
      const cacheStore = (this.cacheManager as any).store;
      if (cacheStore && typeof cacheStore.reset === 'function') {
        await cacheStore.reset();
      }
      this.logger.log('Cache RESET: All keys cleared');
    } catch (error) {
      this.logger.error('Cache RESET error:', error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // If not in cache, compute the value
    const value = await factory();
    
    // Store in cache
    await this.set(key, value, ttl);
    
    return value;
  }

  /**
   * Get cache statistics - list all cached keys
   */
  async getStats(): Promise<{ keys: string[]; count: number }> {
    try {
      const cacheStore = (this.cacheManager as any).store;
      
      // For memory-based cache stores
      if (cacheStore && cacheStore.data) {
        const keys = Object.keys(cacheStore.data);
        return {
          keys,
          count: keys.length,
        };
      }

      // Fallback if structure is different
      const keys = cacheStore?.keys ? await cacheStore.keys() : [];
      return { keys, count: keys.length };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { keys: [], count: 0 };
    }
  }
}
