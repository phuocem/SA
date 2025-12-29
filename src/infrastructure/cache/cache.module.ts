import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import { HttpCacheInterceptor } from './http-cache.interceptor';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes default
      max: 100, // max items in cache
    }),
  ],
  providers: [CacheService, HttpCacheInterceptor],
  controllers: [CacheController],
  exports: [CacheService, NestCacheModule, HttpCacheInterceptor],
})
export class CacheModule {}
