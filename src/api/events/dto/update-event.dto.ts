import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, MinLength, Min } from 'class-validator';

export class UpdateEventDto {
	@ApiPropertyOptional({ example: 'Updated Event Name' })
	@IsOptional()
	@IsString()
	@MinLength(3)
	@MaxLength(255)
	name?: string;

	@ApiPropertyOptional({ example: 'Updated description' })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({ example: '2025-12-31T09:00:00Z' })
	@IsOptional()
	@IsDateString()
	start_time?: string;

	@ApiPropertyOptional({ example: '2025-12-31T11:00:00Z' })
	@IsOptional()
	@IsDateString()
	end_time?: string;

	@ApiPropertyOptional({ example: 'Updated Hall' })
	@IsOptional()
	@IsString()
	location?: string;

	@ApiPropertyOptional({ example: 200 })
	@IsOptional()
	@IsInt()
	@Min(1)
	capacity?: number;

	@ApiPropertyOptional({ example: 'published' })
	@IsOptional()
	@IsString()
	status?: string;

	@ApiPropertyOptional({ example: 1, description: 'User ID chỉnh sửa' })
	@IsOptional()
	@IsInt()
	created_by?: number;
}
