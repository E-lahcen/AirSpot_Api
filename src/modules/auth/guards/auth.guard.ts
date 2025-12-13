import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Auth, DecodedIdToken } from 'firebase-admin/auth';
import { Request } from 'express';
import { FIREBASE_AUTH } from '@app/modules/firebase/firebase.constants';
import { TenantService } from '@app/modules/tenant/services/tenant.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UserService } from '@app/modules/user/services/user.service';

export interface CustomClaims {
  firebaseTenantId: string;
  tenantId: string;
  slug: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_AUTH)
    private readonly auth: Auth,
    private readonly tenantService: TenantService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Get tenant slug and Firebase tenant ID from request (set by TenantMiddleware)
      const slug = this.tenantService.getSlug();
      const firebaseTenantId = this.tenantService.getFirebaseTenantId();

      if (!slug || !firebaseTenantId) {
        throw new UnauthorizedException('Tenant context not found');
      }

      // Get tenant-specific Firebase Auth instance using Firebase tenant ID
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(firebaseTenantId);

      // Verify the Firebase ID token
      const decodedToken: DecodedIdToken =
        await tenantAuth.verifyIdToken(token);

      // Verify token belongs to the correct tenant
      if (decodedToken.firebase.tenant !== firebaseTenantId) {
        throw new UnauthorizedException('Token does not match tenant context');
      }

      // Extract custom claims
      const customClaims = decodedToken as DecodedIdToken & CustomClaims;

      const user = await this.userService.findByFirebaseUid(decodedToken.uid);

      // Attach user info to request
      request.user = {
        ...user,
        firebaseTenantId: customClaims.firebaseTenantId,
        tenantId: customClaims.tenantId,
        slug: customClaims.slug,
      };

      // Check tenant status
      const tenant = this.tenantService.getTenant();
      if (tenant && tenant.status !== 'approved') {
        const isSuperAdmin = user.roles?.some(
          (role) => role.name === 'super_admin',
        );

        if (!isSuperAdmin) {
          throw new UnauthorizedException({
            message: 'Tenant verification pending',
            errors: [
              {
                code: 'TENANT_NOT_APPROVED',
                message: `Your organization is currently ${tenant.status}. Please contact support.`,
              },
            ],
          });
        }
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
