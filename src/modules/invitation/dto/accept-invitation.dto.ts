import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  ValidateIf,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AcceptInvitationDto {
  @ApiProperty({
    description: "Invitation token",
    example: "a1b2c3d4e5f6...",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: "First name of the user (required for tenant registration)",
    example: "John",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @ApiProperty({
    description: "Last name of the user (required for tenant registration)",
    example: "Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  last_name?: string;

  @ApiProperty({
    description: "Full name of the user (required for tenant registration)",
    example: "John Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description:
      "Password for the account (minimum 6 characters, required for tenant registration)",
    example: "SecurePass123!",
    minLength: 6,
    required: false,
  })
  @ValidateIf((o: AcceptInvitationDto) => o.password !== undefined)
  @IsString()
  @MinLength(6)
  password?: string;
}
