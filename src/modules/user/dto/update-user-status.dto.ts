import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Whether the user is active', example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Suspended for policy violation',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
