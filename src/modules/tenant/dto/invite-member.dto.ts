import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Role to assign to the invited user (admin or member only)',
    example: 'member',
    enum: ['admin', 'member'],
    default: 'member',
  })
  @IsString()
  @IsOptional()
  @IsIn(['admin', 'member'], {
    message:
      'Role must be either "admin" or "member". Owner role cannot be assigned via invitation.',
  })
  role?: string;
}
