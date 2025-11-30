import { ApiProperty } from "@nestjs/swagger";
import { User } from "@app/modules/user/entities/user.entity";

export class AcceptInvitationResponseDto {
  @ApiProperty({
    description: "Firebase custom token for authentication",
  })
  access_token: string;

  @ApiProperty({
    description: "User information",
  })
  user: User;

  @ApiProperty({
    description: "Tenant information",
  })
  tenant: {
    id: string;
    slug: string;
    company_name: string;
    firebase_tenant_id: string;
  };
}
