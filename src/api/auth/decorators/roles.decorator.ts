import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../constants/roles.constants';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
