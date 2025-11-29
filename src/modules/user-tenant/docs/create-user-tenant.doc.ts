import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from "@nestjs/swagger";
import { CreateUserTenantDto } from "../dtos/create-user-tenant.dto";

export function ApiCreateUserTenant() {
  return applyDecorators(
    ApiOperation({
      summary: "Create a user-tenant association",
      description: "Associates a user with a tenant",
    }),
    ApiSecurity("x-tenant-slug"),
    ApiBody({ type: CreateUserTenantDto }),
    ApiResponse({
      status: 201,
      description: "User-tenant association created successfully",
      schema: {
        example: {
          statusCode: 201,
          message: "User-tenant association created successfully",
          data: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            user_id: "123e4567-e89b-12d3-a456-426614174001",
            tenant_id: "123e4567-e89b-12d3-a456-426614174002",
            created_at: "2025-01-20T10:00:00.000Z",
            updated_at: "2025-01-20T10:00:00.000Z",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid input data",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing authentication token",
    })
  );
}
