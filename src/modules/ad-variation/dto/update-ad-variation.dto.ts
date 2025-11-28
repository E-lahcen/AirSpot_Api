import { PartialType } from '@nestjs/swagger';
import { CreateAdVariationDto } from './create-ad-variation.dto';

export class UpdateAdVariationDto extends PartialType(CreateAdVariationDto) {}
