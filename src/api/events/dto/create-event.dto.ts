import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, MinLength, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'New Year Meetup' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Community gathering to celebrate the new year' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-12-31T09:00:00Z' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ example: '2025-12-31T11:00:00Z' })
  @IsDateString()
  end_time: string;

  @ApiPropertyOptional({ example: 'Main Hall' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1, description: 'User ID tạo event' })
  @IsOptional()
  @IsInt()
  created_by?: number;
}
