import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findById(userId: number) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });
  }

  async create(email: string, password: string, name: string, roleId: number = 3) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name,
        role_id: roleId,
      },
      include: { role: true },
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Assign a role to a user by role ID
   */
  async assignRole(userId: number, roleId: number) {
    return this.prisma.user.update({
      where: { user_id: userId },
      data: { role_id: roleId },
      include: { role: true },
    });
  }

  /**
   * Assign a role to a user by role name (ADMIN, STAFF, USER)
   */
  async assignRoleByName(userId: number, roleName: string) {
    // Find role by name
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Update user's role
    return this.prisma.user.update({
      where: { user_id: userId },
      data: { role_id: role.role_id },
      include: { role: true },
    });
  }

  /**
   * Get all users with their roles
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      include: { role: true },
    });
  }
}

