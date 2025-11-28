import { PaginationDto } from '@app/common/dtos/pagination.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTemplateDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by template name' })
  @IsString()
  @IsOptional()
  name?: string;
}
