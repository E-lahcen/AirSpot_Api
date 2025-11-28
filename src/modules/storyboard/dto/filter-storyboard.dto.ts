import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PaginationDto } from '@app/common/dtos/pagination.dto';

export class FilterStoryboardDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by storyboard title' })
  @IsString()
  @IsOptional()
  title?: string;
}
