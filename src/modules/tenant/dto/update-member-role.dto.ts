import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'Role name to assign to the member',
    example: 'admin',
    enum: ['owner', 'admin', 'member'],
  })
  @IsString()
  @IsNotEmpty()
  role: string;
}
