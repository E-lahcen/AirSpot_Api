import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ImageType {
  LOGO = 'logo',
  PRODUCT_IMAGE = 'productImage',
}

export class UploadImageDto {
  @ApiPropertyOptional({
    enum: ImageType,
    description: 'Type of image being uploaded',
    default: ImageType.PRODUCT_IMAGE,
  })
  @IsEnum(ImageType)
  @IsOptional()
  imageType?: ImageType;
}
