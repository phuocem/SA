import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { UserRole, ROLE_DESCRIPTIONS } from './constants/roles.constants';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Initialize default roles in database
   */
  async initializeRoles(): Promise<void> {
    for (const roleName of Object.values(UserRole)) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: roleName as string },
      });

      if (!existingRole) {
        await this.prisma.role.create({
          data: {
            name: roleName as string,
          },
        });
        console.log(`✓ Created role: ${roleName}`);
      }
    }
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    return this.cacheService.getOrSet(
      'roles:all',
      async () => {
        return this.prisma.role.findMany({
          include: {
            users: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
          },
        });
      },
      600000, // 10 minutes - roles rarely change
    );
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: number) {
    return this.cacheService.getOrSet(
      `roles:${roleId}`,
      async () => {
        return this.prisma.role.findUnique({
          where: { role_id: roleId },
          include: {
            users: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
          },
        });
      },
      600000, // 10 minutes
    );
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: UserRole) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Get role description
   */
  getRoleDescription(role: UserRole): string {
    return ROLE_DESCRIPTIONS[role];
  }
}
