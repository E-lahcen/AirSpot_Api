import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard, RolesGuard } from "../guards";
import { Roles } from "./roles.decorator";

/**
 * Composite decorator that combines authentication and role-based authorization
 * Restricts access to owner and admin roles only
 */
export function AdminAccess() {
  return applyDecorators(
    UseGuards(AuthGuard, RolesGuard),
    Roles("owner", "admin"),
  );
}
