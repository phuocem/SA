import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../auth/constants/roles.constants';

export class AssignRoleDto {
  @IsEnum(UserRole, {
    message: 'Role must be one of: ADMIN, STAFF, USER',
  })
  @IsNotEmpty()
  role: UserRole;
}
