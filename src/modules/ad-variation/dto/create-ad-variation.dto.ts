import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BiddingStrategy } from '../entities/ad-variation.entity';

export class CreateAdVariationDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsString()
  campaign_id: string;

  @ApiProperty({ description: 'Ad variation name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Creative ID' })
  @IsString()
  @IsOptional()
  creative_id?: string;

  @ApiPropertyOptional({
    enum: BiddingStrategy,
    description: 'Bidding strategy',
    default: BiddingStrategy.AUTOMATIC,
  })
  @IsEnum(BiddingStrategy)
  @IsOptional()
  bidding_strategy?: BiddingStrategy;

  @ApiPropertyOptional({
    description: 'CPM bid amount (required if bidding strategy is MANUAL_CPM)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf(
    (o: { bidding_strategy: BiddingStrategy }) =>
      o.bidding_strategy === BiddingStrategy.MANUAL_CPM,
  )
  cpm_bid?: number;
}
