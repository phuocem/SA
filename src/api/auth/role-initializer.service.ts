import { Injectable, OnModuleInit } from '@nestjs/common';
import { RolesService } from './roles.service';

@Injectable()
export class RoleInitializer implements OnModuleInit {
  constructor(private rolesService: RolesService) {}

  async onModuleInit() {
    try {
      await this.rolesService.initializeRoles();
    } catch (error) {
      console.error('Failed to initialize roles:', error);
    }
  }
}
