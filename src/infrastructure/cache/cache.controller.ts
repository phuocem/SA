import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CacheService } from './cache.service';
import { RequireRole } from '../../api/auth/decorators/require-role.decorator';
import { UserRole } from '../../api/auth/constants/roles.constants';
import { JwtAuthGuard } from '../../api/auth/guards/jwt-auth.guard';

@ApiTags('Cache')
@ApiBearerAuth()
@Controller('cache')
@UseGuards(JwtAuthGuard)
export class CacheController {
  constructor(private cacheService: CacheService) {}

  /**
   * Get cache statistics (Admin only)
   */
  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê cache (Admin)' })
  @RequireRole(UserRole.ADMIN)
  async getCacheStats() {
    const stats = await this.cacheService.getStats();
    return stats;
  }

  /**
   * Clear specific cache key (Admin only)
   */
  @Delete(':key')
  @ApiOperation({ summary: 'Xoá 1 cache key (Admin)' })
  @RequireRole(UserRole.ADMIN)
  async clearCacheKey(@Param('key') key: string) {
    await this.cacheService.del(key);
    return { message: `Cache key '${key}' cleared successfully` };
  }

  /**
   * Clear all cache (Admin only)
   */
  @Post('reset')
  @ApiOperation({ summary: 'Xoá toàn bộ cache (Admin)' })
  @RequireRole(UserRole.ADMIN)
  async resetCache() {
    await this.cacheService.reset();
    return { message: 'All cache cleared successfully' };
  }

  /**
   * Clear events cache (Admin/Staff only)
   */
  @Post('events/clear')
  @ApiOperation({ summary: 'Xoá cache sự kiện (Admin/Staff)' })
  @RequireRole(UserRole.STAFF, UserRole.ADMIN)
  async clearEventsCache() {
    await this.cacheService.delPattern('events:*');
    return { message: 'Events cache cleared successfully' };
  }

  /**
   * Clear roles cache (Admin only)
   */
  @Post('roles/clear')
  @ApiOperation({ summary: 'Xoá cache roles (Admin)' })
  @RequireRole(UserRole.ADMIN)
  async clearRolesCache() {
    await this.cacheService.del('roles:all');
    return { message: 'Roles cache cleared successfully' };
  }
}
