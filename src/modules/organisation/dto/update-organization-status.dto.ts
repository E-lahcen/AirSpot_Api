import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum OrganizationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class UpdateOrganizationStatusDto {
  @ApiProperty({
    description: 'Status of the organization',
    enum: OrganizationStatus,
    example: OrganizationStatus.APPROVED,
  })
  @IsEnum(OrganizationStatus)
  @IsNotEmpty()
  status: OrganizationStatus;
}
