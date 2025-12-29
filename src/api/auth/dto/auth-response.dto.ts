import { ApiProperty } from '@nestjs/swagger';

class AuthRoleDto {
  @ApiProperty({ example: 1 })
  role_id: number;

  @ApiProperty({ example: 'admin' })
  name: string;
}

class AuthUserDto {
  @ApiProperty({ example: 10 })
  user_id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'User Name' })
  name: string;

  @ApiProperty({ type: AuthRoleDto })
  role: AuthRoleDto;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refresh_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
