import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_HIERARCHY, UserRole } from '../constants/roles.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const userRole = user.role?.name as UserRole;

    if (!userRole) {
      throw new ForbiddenException('User has no role assigned');
    }

    // Check if user's role is in required roles or higher in hierarchy
    const hasRequiredRole = requiredRoles.some(
      (requiredRole) =>
        userRole === requiredRole ||
        (ROLE_HIERARCHY[userRole] && ROLE_HIERARCHY[userRole].includes(requiredRole)),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${userRole}`,
      );
    }

    return true;
  }
}
