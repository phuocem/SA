import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../constants/roles.constants';

/**
 * Protects a route requiring authentication and specific roles
 * Usage: @RequireRole(UserRole.ADMIN) or @RequireRole(UserRole.ADMIN, UserRole.STAFF)
 */
export function RequireRole(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
