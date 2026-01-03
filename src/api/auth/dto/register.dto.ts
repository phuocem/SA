import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  @Matches(/^[^@\s]+@gmail\.com$/i, { message: 'Email phải dùng đuôi @gmail.com' })
  email: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'New User' })
  @IsString()
  name: string;
}
