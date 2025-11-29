import { IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TargetType } from '../entities/audience.entity';

export class CreateAudienceDto {
  @ApiProperty({ description: 'Ad variation ID' })
  @IsString()
  variation_id: string;

  @ApiProperty({ enum: TargetType, description: 'Target type' })
  @IsEnum(TargetType)
  type: TargetType;

  @ApiProperty({ description: 'Provider ID' })
  @IsNumber()
  @Min(1)
  provider_id: number;

  @ApiProperty({ description: 'Target ID' })
  @IsString()
  target_id: string;
}
