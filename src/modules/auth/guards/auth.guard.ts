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
import { SKIP_TENANT_KEY } from '../decorators/skip-tenant.decorator';
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

    // Check if route should skip tenant context requirement
    const skipTenant = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

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

      // For routes that skip tenant validation requirement
      if (skipTenant) {
        // Even for skipTenant routes, we might need tenant context for user lookup
        // If tenant context exists, use it; otherwise proceed without it
        if (slug && firebaseTenantId) {
          // Verify token with tenant auth if available
          const tenantAuth = this.auth
            .tenantManager()
            .authForTenant(firebaseTenantId);
          const decodedToken: DecodedIdToken =
            await tenantAuth.verifyIdToken(token);

          const user = await this.userService.findByFirebaseUid(
            decodedToken.uid,
          );

          // Attach user info to request with tenant context
          request.user = {
            ...user,
            firebaseTenantId: firebaseTenantId,
            tenantId: user?.id || '',
            slug: slug,
          };
        } else {
          // No tenant context available - verify with default auth
          const decodedToken: DecodedIdToken =
            await this.auth.verifyIdToken(token);

          // Attach minimal user info without tenant context
          request.user = {
            id: decodedToken.uid,
            email: decodedToken.email || '',
            firebaseTenantId: '',
            tenantId: '',
            slug: '',
            roles: [],
          } as AuthenticatedUser;
        }

        return true;
      }

      if (!slug || !firebaseTenantId) {
        throw new UnauthorizedException('Tenant context not found');
      }

      // Get tenant-specific Firebase Auth instance using Firebase tenant ID
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(firebaseTenantId);

      let decodedToken: DecodedIdToken;
      try {
        // Verify the Firebase ID token against the expected tenant
        decodedToken = await tenantAuth.verifyIdToken(token);
      } catch {
        // Secondary check: try verifying with default auth to provide clearer error messages
        try {
          const decodedWithDefault: DecodedIdToken =
            await this.auth.verifyIdToken(token);
          // If it verifies with default but not tenant, it's likely a tenant mismatch or wrong token
          const tokenTenant = decodedWithDefault.firebase?.tenant || 'unknown';
          throw new UnauthorizedException({
            message: 'Token does not match tenant context',
            errors: [
              {
                code: 'TENANT_MISMATCH',
                message: `Token tenant: ${tokenTenant}, expected: ${firebaseTenantId}`,
              },
            ],
          });
        } catch {
          // Try to decode token payload without verifying to give better diagnostics
          const parts = token.split('.');
          let tokenTenant = 'unknown';
          let aud = 'unknown';
          try {
            if (parts.length === 3) {
              const payloadRaw: unknown = JSON.parse(
                Buffer.from(
                  parts[1].replace(/-/g, '+').replace(/_/g, '/'),
                  'base64',
                ).toString('utf8'),
              );
              if (typeof payloadRaw === 'object' && payloadRaw !== null) {
                const obj = payloadRaw as {
                  firebase?: { tenant?: string };
                  aud?: unknown;
                };
                tokenTenant =
                  typeof obj.firebase?.tenant === 'string'
                    ? obj.firebase.tenant
                    : 'unknown';
                aud = typeof obj.aud === 'string' ? obj.aud : 'unknown';
              }
            }
          } catch {
            // ignore decoding errors
          }

          // Token is not a valid Firebase ID token for this tenant or project. Provide helpful metadata.
          const appOptions = this.auth.app?.options;
          const expectedProjectId = appOptions?.projectId ?? 'unknown';
          throw new UnauthorizedException({
            message: 'Invalid authentication token',
            errors: [
              {
                code: 'INVALID_ID_TOKEN',
                message:
                  'Provided token is not a valid Firebase ID token for this tenant. Ensure you are using id_token from switch and not a custom or refresh token.',
              },
              {
                code: 'TOKEN_METADATA',
                message: `token.aud: ${aud}, expected project: ${expectedProjectId}, token.tenant: ${tokenTenant}, expected tenant: ${firebaseTenantId}`,
              },
            ],
          });
        }
      }

      // Verify token belongs to the correct tenant
      if (decodedToken.firebase.tenant !== firebaseTenantId) {
        throw new UnauthorizedException({
          message: 'Token does not match tenant context',
          errors: [
            {
              code: 'TENANT_MISMATCH',
              message: `Token tenant: ${decodedToken.firebase.tenant}, expected: ${firebaseTenantId}`,
            },
          ],
        });
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
      throw new UnauthorizedException({
        message: 'Invalid authentication token',
        errors: [
          {
            code: 'ERROR_DETAILS',
            message: 'Invalid authentication token',
          },
        ],
      });
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
