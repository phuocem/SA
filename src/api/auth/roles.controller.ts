import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequireRole } from './decorators/require-role.decorator';
import { UserRole } from './constants/roles.constants';
import { HttpCacheInterceptor } from '../../infrastructure/cache/http-cache.interceptor';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard)
@UseInterceptors(HttpCacheInterceptor)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  /**
   * Get all roles with their users
   * Only admins can access this
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả vai trò (Admin)' })
  @RequireRole(UserRole.ADMIN)
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  /**
   * Get role by ID with its users
   * Only admins can access this
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy vai trò theo ID (Admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @RequireRole(UserRole.ADMIN)
  async getRoleById(@Param('id') roleId: string) {
    return this.rolesService.getRoleById(parseInt(roleId));
  }
}
