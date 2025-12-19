import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UserService } from '@app/modules/user/services/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has roles array (might be undefined for non-tenant routes)
    if (!user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException(
        'User roles not available. This endpoint may require tenant context.',
      );
    }

    // Check if user has any of the required roles
    const hasRole = user.roles.some((r) => requiredRoles.includes(r.name));
    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
