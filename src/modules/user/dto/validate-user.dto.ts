import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateUserDto {
  @ApiProperty({ description: 'Whether the user is approved', example: true })
  @IsBoolean()
  is_approved: boolean;

  @ApiPropertyOptional({
    description: 'Notes about the validation',
    example: 'User verified and approved',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
