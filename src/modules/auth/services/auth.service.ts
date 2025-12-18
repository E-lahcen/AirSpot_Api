import { FIREBASE_AUTH } from '@app/modules/firebase/firebase.constants';
import {
  Inject,
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Auth, UserRecord } from 'firebase-admin/auth';
import { UserService } from '@app/modules/user/services/user.service';
import { TenantManagementService } from '@app/modules/tenant/services/tenant-management.service';
import { TenantService } from '@app/modules/tenant/services/tenant.service';
import { RoleService } from '@app/modules/role/services/role.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { EnvironmentVariables } from '@app/core/validators';
import { FirebaseService } from '@app/modules/firebase/services/firebase.service';
import { UserTenantService } from '@app/modules/user-tenant/services/user-tenant.service';
import { Role } from '@app/modules/role/entities/role.entity';
import { User } from '@app/modules/user/entities/user.entity';
import { Tenant } from '@app/modules/tenant/entities/tenant.entity';
import { EmailVerification } from '../entities/email-verification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '@app/modules/notification/services/email.service';
import { SendVerificationDto } from '../dto/send-verification.dto';

export interface CreateTenantUserParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  tenant: Tenant;
  role: Role;
}

export interface CreateTenantUserResult {
  user: User;
  accessToken: string;
  firebaseUid: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(FIREBASE_AUTH)
    private readonly auth: Auth,
    private readonly userService: UserService,
    private readonly tenantManagementService: TenantManagementService,
    private readonly tenantService: TenantService,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly firebaseService: FirebaseService,
    private readonly userTenantService: UserTenantService,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Shared method to create a user within an existing tenant
   * Used by both registration and invitation acceptance flows
   */
  async createTenantUser(
    params: CreateTenantUserParams,
  ): Promise<CreateTenantUserResult> {
    const { email, password, firstName, lastName, fullName, tenant, role } =
      params;

    try {
      // Step 1: Set tenant context for this operation
      this.tenantService.setTenant(tenant);

      // Step 7: Ensure default roles exist
      await this.roleService.ensureDefaultRoles();

      // Step 2: Check if user already exists in tenant
      const existingUser = await this.userService.findByEmail(email);

      if (existingUser) {
        throw new ConflictException({
          message: 'User already exists',
          errors: [
            {
              code: 'USER_EXISTS',
              message: 'A user with this email already exists in this tenant',
            },
          ],
        });
      }

      // Step 3: Create Firebase user within the tenant
      const firebaseUser = await this.firebaseService.createTenantUser(
        tenant.firebase_tenant_id,
        email,
        password,
        fullName || `${firstName} ${lastName}`,
      );

      // Step 4: Create user in tenant schema
      const user = await this.userService.createUser({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName || `${firstName} ${lastName}`,
        company_name: tenant.company_name,
        email: email,
        firebase_uid: firebaseUser.uid,
        roles: [role],
      });

      // Step 5: Create user-tenant mapping in public schema
      await this.userTenantService.create({
        user_id: user.id,
        tenant_id: tenant.id,
        email: email,
      });

      // Step 6: Set custom claims for Firebase user
      await this.firebaseService.setTenantUserClaims(
        tenant.firebase_tenant_id,
        firebaseUser.uid,
        {
          firebaseTenantId: tenant.firebase_tenant_id,
          tenantId: tenant.id,
          slug: tenant.slug,
          roles: [role],
        },
      );

      // Step 7: Create custom token for the user to sign in
      const accessToken = await this.firebaseService.createTenantCustomToken(
        tenant.firebase_tenant_id,
        firebaseUser.uid,
        {
          slug: tenant.slug,
          tenantId: tenant.id,
          roles: [role],
          firebaseTenantId: tenant.firebase_tenant_id,
        },
      );

      return {
        user,
        accessToken,
        firebaseUid: firebaseUser.uid,
      };
    } catch (error) {
      // Handle Firebase errors
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-exists')) {
          throw new ConflictException({
            message: 'Email already exists in Firebase',
            errors: [
              {
                code: 'FIREBASE_EMAIL_EXISTS',
                message: 'This email is already registered in Firebase',
              },
            ],
          });
        }
      }

      // Re-throw known errors
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle unknown errors
      throw new BadRequestException({
        message: 'Failed to create tenant user',
        errors: [
          {
            code: 'USER_CREATION_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        ],
      });
    }
  }

  async sendVerificationCode(dto: SendVerificationDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiration

    let verification = await this.emailVerificationRepository.findOne({
      where: { email: dto.email },
    });

    if (!verification) {
      verification = this.emailVerificationRepository.create({
        email: dto.email,
      });
    }

    verification.code = code;
    verification.expires_at = expiresAt;
    verification.is_verified = false;

    await this.emailVerificationRepository.save(verification);

    await this.emailService.send({
      recipient: dto.email,
      subject: 'AirSpot Verification Code',
      message: `Your verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Use the following code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `,
    });

    return { message: 'Verification code sent' };
  }

  async verifyEmail(email: string, code: string) {
    const verification = await this.emailVerificationRepository.findOne({
      where: { email },
    });

    if (!verification) {
      throw new BadRequestException({
        message: 'Verification code not found',
        errors: [
          {
            code: 'VERIFICATION_NOT_FOUND',
            message: 'Please request a verification code first',
          },
        ],
      });
    }

    if (verification.code !== code) {
      throw new BadRequestException({
        message: 'Invalid verification code',
        errors: [
          {
            code: 'INVALID_CODE',
            message: 'The provided verification code is incorrect',
          },
        ],
      });
    }

    if (new Date() > verification.expires_at) {
      throw new BadRequestException({
        message: 'Verification code expired',
        errors: [
          {
            code: 'CODE_EXPIRED',
            message:
              'The verification code has expired. Please request a new one',
          },
        ],
      });
    }

    if (verification.is_verified) {
      return { message: 'Email already verified', verified: true };
    }

    verification.is_verified = true;
    await this.emailVerificationRepository.save(verification);

    return { message: 'Email verified successfully', verified: true };
  }

  async register(dto: RegisterDto) {
    // Step 0: Check Email Verification Status
    const verification = await this.emailVerificationRepository.findOne({
      where: { email: dto.email },
    });

    if (!verification) {
      throw new BadRequestException({
        message: 'Email verification required',
        errors: [
          {
            code: 'VERIFICATION_REQUIRED',
            message: 'Please verify your email before registering',
          },
        ],
      });
    }

    if (!verification.is_verified) {
      throw new BadRequestException({
        message: 'Email not verified',
        errors: [
          {
            code: 'EMAIL_NOT_VERIFIED',
            message:
              'Please verify your email using the verification code before registering',
          },
        ],
      });
    }

    try {
      // Step 1: Check if company already has a tenant
      const existingTenant =
        await this.tenantManagementService.findByCompanyName(dto.company_name);
      if (existingTenant) {
        throw new ConflictException({
          message: 'Company already exists',
          errors: [
            {
              code: 'COMPANY_EXISTS',
              message: 'A tenant for this company already exists',
            },
          ],
        });
      }

      // Step 2: Create Firebase tenant with formatted display name
      const firebaseTenant = await this.firebaseService.createTenant(
        dto.company_name,
      );
      // Step 3: Create database tenant (record + schema)
      const tenant = await this.tenantManagementService.createTenant({
        companyName: dto.company_name,
        ownerEmail: dto.email,
        firebaseTenantId: firebaseTenant.tenantId,
      });

      // Step 4: Set tenant context and ensure default roles exist
      this.tenantService.setTenant(tenant);
      await this.roleService.ensureDefaultRoles();

      // Step 5: Get owner role
      const owner = await this.roleService.findByName('owner');
      if (!owner) {
        throw new NotFoundException({
          message: 'Owner role not found',
          errors: [
            {
              code: 'ROLE_NOT_FOUND',
              message: 'Default owner role does not exist',
            },
          ],
        });
      }

      // Step 6: Create user using shared method
      const { user, accessToken } = await this.createTenantUser({
        email: dto.email,
        password: dto.password,
        firstName: dto.first_name,
        lastName: dto.last_name,
        fullName: dto.name,
        tenant,
        role: owner,
      });

      // Step 7: Set tenant owner
      await this.tenantManagementService.setTenantOwner(tenant.id, user.id);

      return {
        access_token: accessToken,
        user,
        tenant: {
          ...tenant,
          owner_id: user.id,
        },
      };
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException({
        message: 'Registration failed',
        errors: [
          {
            code: 'REGISTRATION_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        ],
      });
    } finally {
      // Clean up verification (optional, can keep for logs but remove for security/reuse)
      const verification = await this.emailVerificationRepository.findOne({
        where: { email: dto.email },
      });
      if (verification) {
        await this.emailVerificationRepository.remove(verification);
      }
    }
  }

  async login(dto: LoginDto) {
    try {
      // Step 1: Find tenant by slug
      const userTenantResult = await this.userTenantService.findAll({
        email: dto.email,
      });
      if (!userTenantResult?.items?.length) {
        throw new NotFoundException({
          message: 'Tenant not found for provided email',
          errors: [
            {
              code: 'TENANT_NOT_FOUND_FOR_EMAIL',
              message: `No tenant associated with email ${dto.email}`,
            },
          ],
        });
      }

      const tenantSlug = userTenantResult.items[0].tenant.slug;
      // Step 1: Find tenant by slug
      const tenant = await this.tenantManagementService.findBySlug(tenantSlug);
      if (!tenant) {
        throw new NotFoundException({
          message: 'Tenant not found',
          errors: [
            {
              code: 'TENANT_NOT_FOUND',
              message: `No tenant found with slug: ${tenant.slug}`,
            },
          ],
        });
      }

      if (!tenant.is_active) {
        throw new UnauthorizedException({
          message: 'Tenant is inactive',
          errors: [
            {
              code: 'TENANT_INACTIVE',
              message: 'This tenant account has been deactivated',
            },
          ],
        });
      }

      // Step 2: Get tenant-specific auth
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(tenant.firebase_tenant_id);

      // Step 3: Verify user credentials using Firebase Auth REST API
      // Note: Admin SDK doesn't have signInWithEmailAndPassword, so we create a custom token
      const firebaseUser = await tenantAuth.getUserByEmail(dto.email);

      if (!firebaseUser) {
        throw new UnauthorizedException({
          message: 'Invalid credentials',
          errors: [
            {
              code: 'INVALID_CREDENTIALS',
              message: 'Email or password is incorrect',
            },
          ],
        });
      }

      // Step 4: Create custom token for the user (client will exchange for ID token)
      const customToken = await tenantAuth.createCustomToken(firebaseUser.uid, {
        slug: tenant.slug,
        firebaseTenantId: tenant.firebase_tenant_id,
      });

      // Step 5: Set tenant context
      this.tenantService.setTenant(tenant);

      // Step 6: Get user from tenant database
      const user = await this.userService.findByFirebaseUid(firebaseUser.uid);

      if (!user) {
        throw new UnauthorizedException({
          message: 'User not found in tenant database',
          errors: [
            {
              code: 'USER_NOT_FOUND',
              message: 'User record not found',
            },
          ],
        });
      }

      if (tenant.status !== 'approved') {
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

      return {
        access_token: customToken,
        user,
        tenant,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Handle Firebase auth errors
      if (
        error instanceof Error &&
        error.message.includes('auth/user-not-found')
      ) {
        throw new UnauthorizedException({
          message: 'Invalid credentials',
          errors: [
            {
              code: 'INVALID_CREDENTIALS',
              message: 'Email or password is incorrect',
            },
          ],
        });
      }

      throw new BadRequestException({
        message: 'Login failed',
        errors: [
          {
            code: 'LOGIN_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        ],
      });
    }
  }

  async getMe(firebaseUid: string) {
    const user = await this.userService.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        errors: [
          {
            code: 'USER_NOT_FOUND',
            message: 'User record not found',
          },
        ],
      });
    }

    return user;
  }

  async exchangeCustomToken(customToken: string, tenantSlug: string) {
    const apiKey = this.configService.get<string>('FIREBASE_WEB_API_KEY');

    if (!apiKey) {
      throw new BadRequestException({
        message: 'Firebase API key not configured',
        errors: [
          {
            code: 'MISSING_CONFIG',
            message: 'FIREBASE_WEB_API_KEY environment variable is required',
          },
        ],
      });
    }

    // Get tenant to find Firebase tenant ID
    const tenant = await this.tenantManagementService.findBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException({
        message: 'Tenant not found',
        errors: [
          {
            code: 'TENANT_NOT_FOUND',
            message: `No tenant found with slug: ${tenantSlug}`,
          },
        ],
      });
    }

    if (!tenant.is_active) {
      throw new UnauthorizedException({
        message: 'Tenant is inactive',
        errors: [
          {
            code: 'TENANT_INACTIVE',
            message: 'This tenant account has been deactivated',
          },
        ],
      });
    }

    // Exchange custom token for ID token using tenant-specific Firebase REST API
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
          tenantId: tenant.firebase_tenant_id,
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as {
        error?: { message?: string };
      };
      throw new BadRequestException({
        message: 'Token exchange failed',
        errors: [
          {
            code: 'TOKEN_EXCHANGE_FAILED',
            message: error.error?.message || 'Failed to exchange custom token',
          },
        ],
      });
    }

    const data = (await response.json()) as {
      idToken: string;
      refreshToken: string;
      expiresIn: string;
    };

    if (tenant.status !== 'approved') {
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(tenant.firebase_tenant_id);

      const decoded = await tenantAuth.verifyIdToken(data.idToken);
      const user = await this.userService.findByFirebaseUid(decoded.uid);

      const isSuperAdmin = user?.roles?.some(
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

    return {
      id_token: data.idToken,
      refresh_token: data.refreshToken,
      expires_in: data.expiresIn,
    };
  }

  async refreshToken(refreshToken: string, tenantSlug: string) {
    const apiKey = this.configService.get<string>('FIREBASE_WEB_API_KEY');

    if (!apiKey) {
      throw new BadRequestException({
        message: 'Firebase API key not configured',
        errors: [
          {
            code: 'MISSING_CONFIG',
            message: 'FIREBASE_WEB_API_KEY environment variable is required',
          },
        ],
      });
    }

    // Get tenant to find Firebase tenant ID
    const tenant = await this.tenantManagementService.findBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException({
        message: 'Tenant not found',
        errors: [
          {
            code: 'TENANT_NOT_FOUND',
            message: `No tenant found with slug: ${tenantSlug}`,
          },
        ],
      });
    }

    if (!tenant.is_active) {
      throw new UnauthorizedException({
        message: 'Tenant is inactive',
        errors: [
          {
            code: 'TENANT_INACTIVE',
            message: 'This tenant account has been deactivated',
          },
        ],
      });
    }

    // Refresh the ID token using Firebase REST API
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as {
        error?: { message?: string };
      };
      throw new BadRequestException({
        message: 'Token refresh failed',
        errors: [
          {
            code: 'TOKEN_REFRESH_FAILED',
            message: error.error?.message || 'Failed to refresh token',
          },
        ],
      });
    }

    const data = (await response.json()) as {
      id_token: string;
      refresh_token: string;
      expires_in: string;
      token_type: string;
      user_id: string;
      project_id: string;
    };

    if (tenant.status !== 'approved') {
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(tenant.firebase_tenant_id);

      const decoded = await tenantAuth.verifyIdToken(data.id_token);
      const user = await this.userService.findByFirebaseUid(decoded.uid);

      const isSuperAdmin = user?.roles?.some(
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

    return {
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  }

  /**
   * Google OAuth Login/Register
   * Handles both login and registration for Google users
   * No email verification required as Google already verifies emails
   */
  async googleAuth(
    idToken: string,
    organisationSubdomain?: string,
    organisationName?: string,
  ) {
    try {
      // Step 1: Verify Google ID token
      const decodedToken = await this.auth.verifyIdToken(idToken);
      const email = decodedToken.email;
      const name = decodedToken.name as string | undefined;
      const picture = decodedToken.picture;

      if (!email) {
        throw new BadRequestException({
          message: 'Email not found in Google token',
          errors: [
            {
              code: 'INVALID_GOOGLE_TOKEN',
              message: 'Google account does not have an email address',
            },
          ],
        });
      }

      // Step 2: Split name into first and last name
      const nameToSplit: string = name || email.split('@')[0];
      const nameParts: string[] = nameToSplit.split(' ');
      const firstName: string = nameParts[0] || '';
      const lastName: string =
        nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Step 3: Check if user is logging into existing tenant
      if (organisationSubdomain) {
        return await this.googleLoginToTenant(
          email,
          firstName,
          lastName,
          picture || '',
          organisationSubdomain,
        );
      }

      // Step 4: No subdomain provided - check if user already has tenants
      // Find first tenant where user is owner
      const ownedTenant = await this.tenantManagementService
        .getTenantRepository()
        .findOne({
          where: { owner_email: email, is_active: true },
          order: { created_at: 'ASC' },
        });

      if (ownedTenant) {
        // User already has a tenant - log them in
        return await this.googleLoginToTenant(
          email,
          firstName,
          lastName,
          picture || '',
          ownedTenant.slug,
        );
      }

      // Step 5: No existing tenant found - Register new company/tenant
      return await this.googleRegisterNewTenant(
        email,
        firstName,
        lastName,
        nameToSplit,
        picture || '',
        organisationName,
      );
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException({
        message: 'Google authentication failed',
        errors: [
          {
            code: 'GOOGLE_AUTH_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        ],
      });
    }
  }

  /**
   * Google login to existing tenant
   */
  private async googleLoginToTenant(
    email: string,
    firstName: string,
    lastName: string,
    picture: string,
    organisationSubdomain: string,
  ) {
    // Step 1: Find tenant by subdomain (using slug)
    const tenant = await this.tenantManagementService.findBySlug(
      organisationSubdomain,
    );
    if (!tenant) {
      throw new NotFoundException({
        message: 'Organisation not found',
        errors: [
          {
            code: 'TENANT_NOT_FOUND',
            message: 'No organisation found with this subdomain',
          },
        ],
      });
    }

    // Step 2: Set tenant context
    this.tenantService.setTenant(tenant);

    // Step 3: Check if user exists in this tenant
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      // User exists - login
      // Get or create Firebase user in this tenant
      let firebaseUser: UserRecord;
      try {
        const tenantAuth = this.auth
          .tenantManager()
          .authForTenant(tenant.firebase_tenant_id);
        firebaseUser = await tenantAuth.getUserByEmail(email);
      } catch {
        // Firebase user doesn't exist, create it
        firebaseUser = await this.firebaseService.createTenantUser(
          tenant.firebase_tenant_id,
          email,
          undefined, // No password for Google users
          `${firstName} ${lastName}`,
        );

        // Update local user with Firebase UID
        await this.userService.updateUser(existingUser.id, {
          firebase_uid: firebaseUser.uid,
        });
      }

      // Generate custom token
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(tenant.firebase_tenant_id);
      const customToken = await tenantAuth.createCustomToken(firebaseUser.uid);

      return {
        custom_token: customToken,
        firebase_tenant_id: tenant.firebase_tenant_id,
        user: existingUser,
        tenant,
      };
    } else {
      // User doesn't exist in this tenant - create them
      // This handles invitation acceptance or new user joining
      await this.roleService.ensureDefaultRoles();
      const memberRole = await this.roleService.findByName('member');

      if (!memberRole) {
        throw new NotFoundException({
          message: 'Member role not found',
          errors: [
            {
              code: 'ROLE_NOT_FOUND',
              message: 'Default member role does not exist',
            },
          ],
        });
      }

      const { user, firebaseUid } = await this.createTenantUser({
        email,
        password: Math.random().toString(36), // Random password (won't be used)
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        tenant,
        role: memberRole,
      });

      // Generate custom token for the newly created user
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(tenant.firebase_tenant_id);
      const customToken = await tenantAuth.createCustomToken(firebaseUid);

      return {
        custom_token: customToken,
        firebase_tenant_id: tenant.firebase_tenant_id,
        user,
        tenant,
      };
    }
  }

  /**
   * Google registration - creates new tenant for company
   */
  private async googleRegisterNewTenant(
    email: string,
    firstName: string,
    lastName: string,
    fullName: string,
    picture: string,
    organisationName?: string,
  ) {
    // Step 1: Use provided organization name or generate from email domain
    const companyName = organisationName || email.split('@')[1].split('.')[0];

    // Step 2: Check if company already has a tenant
    const existingTenant =
      await this.tenantManagementService.findByCompanyName(companyName);
    if (existingTenant) {
      throw new ConflictException({
        message: 'Company already exists',
        errors: [
          {
            code: 'COMPANY_EXISTS',
            message:
              'A tenant for this company already exists. Please use the login flow with your organisation subdomain.',
          },
        ],
      });
    }

    // Step 3: Create Firebase tenant
    const firebaseTenant = await this.firebaseService.createTenant(companyName);

    // Step 4: Create database tenant
    const tenant = await this.tenantManagementService.createTenant({
      companyName,
      ownerEmail: email,
      firebaseTenantId: firebaseTenant.tenantId,
    });

    // Step 5: Set tenant context and ensure default roles
    this.tenantService.setTenant(tenant);
    await this.roleService.ensureDefaultRoles();

    // Step 6: Get owner role
    const owner = await this.roleService.findByName('owner');
    if (!owner) {
      throw new NotFoundException({
        message: 'Owner role not found',
        errors: [
          {
            code: 'ROLE_NOT_FOUND',
            message: 'Default owner role does not exist',
          },
        ],
      });
    }

    // Step 7: Create user
    const { user, firebaseUid } = await this.createTenantUser({
      email,
      password: Math.random().toString(36), // Random password (won't be used)
      firstName,
      lastName,
      fullName,
      tenant,
      role: owner,
    });

    // Step 8: Set tenant owner
    await this.tenantManagementService.setTenantOwner(tenant.id, user.id);

    // Generate custom token for the newly created user
    const tenantAuth = this.auth
      .tenantManager()
      .authForTenant(tenant.firebase_tenant_id);
    const customToken = await tenantAuth.createCustomToken(firebaseUid);

    return {
      custom_token: customToken,
      firebase_tenant_id: tenant.firebase_tenant_id,
      user,
      tenant: {
        ...tenant,
        owner_id: user.id,
      },
    };
  }

  /**
   * Exchange Firebase custom token for ID token (private helper)
   */
  private async exchangeCustomTokenForIdToken(
    customToken: string,
    tenantId: string,
  ): Promise<string> {
    const apiKey = this.configService.get('FIREBASE_WEB_API_KEY', {
      infer: true,
    });

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
          tenantId,
        }),
      },
    );

    if (!response.ok) {
      const errorResponse = (await response.json()) as {
        error?: { message?: string };
      };
      throw new BadRequestException({
        message: 'Failed to exchange custom token',
        errors: [
          {
            code: 'TOKEN_EXCHANGE_FAILED',
            message: errorResponse.error?.message || 'Token exchange failed',
          },
        ],
      });
    }

    const data = (await response.json()) as { idToken: string };
    return data.idToken;
  }

  /**
   * Switch authenticated user to a different tenant
   * Validates user has access to the target tenant and generates new custom token
   */
  async switchTenant(currentUserFirebaseUid: string, targetTenantSlug: string) {
    // Step 1: Find the target tenant
    const targetTenant =
      await this.tenantManagementService.findBySlug(targetTenantSlug);

    if (!targetTenant) {
      throw new NotFoundException({
        message: 'Tenant not found',
        errors: [
          {
            code: 'TENANT_NOT_FOUND',
            message: `No tenant found with slug: ${targetTenantSlug}`,
          },
        ],
      });
    }

    if (!targetTenant.is_active) {
      throw new UnauthorizedException({
        message: 'Tenant is inactive',
        errors: [
          {
            code: 'TENANT_INACTIVE',
            message: 'This organization is currently inactive',
          },
        ],
      });
    }

    // Step 2: Set tenant context to target tenant
    this.tenantService.setTenant(targetTenant);

    // Step 3: Get current user from Firebase to retrieve email
    let userEmail: string;
    try {
      const firebaseUser = await this.auth.getUser(currentUserFirebaseUid);
      userEmail = firebaseUser.email;
    } catch {
      throw new UnauthorizedException({
        message: 'Invalid user',
        errors: [
          {
            code: 'INVALID_USER',
            message: 'Unable to verify user identity',
          },
        ],
      });
    }

    // Step 4: Check if user exists in target tenant
    const userInTargetTenant = await this.userService.findByEmail(userEmail);

    if (!userInTargetTenant) {
      throw new UnauthorizedException({
        message: 'Access denied',
        errors: [
          {
            code: 'NO_ACCESS',
            message: 'You do not have access to this organization',
          },
        ],
      });
    }

    // Step 5: Get or create Firebase user in target tenant
    let firebaseUserInTenant: UserRecord;
    try {
      const tenantAuth = this.auth
        .tenantManager()
        .authForTenant(targetTenant.firebase_tenant_id);
      firebaseUserInTenant = await tenantAuth.getUserByEmail(userEmail);
    } catch {
      // Create Firebase user in this tenant if doesn't exist
      const [firstName, lastName] =
        userInTargetTenant.first_name && userInTargetTenant.last_name
          ? [userInTargetTenant.first_name, userInTargetTenant.last_name]
          : userEmail.split('@')[0].split('.');

      const createdUser = await this.firebaseService.createTenantUser(
        targetTenant.firebase_tenant_id,
        userEmail,
        undefined, // No password needed for tenant switch
        `${firstName} ${lastName}`,
      );
      firebaseUserInTenant = createdUser;

      // Update user with Firebase UID
      await this.userService.updateUser(userInTargetTenant.id, {
        firebase_uid: createdUser.uid,
      });
    }

    // Step 6: Generate custom token for target tenant
    const tenantAuth = this.auth
      .tenantManager()
      .authForTenant(targetTenant.firebase_tenant_id);
    const customToken = await tenantAuth.createCustomToken(
      firebaseUserInTenant.uid,
    );

    // Step 7: Return custom token and tenant info
    return {
      custom_token: customToken,
      firebase_tenant_id: targetTenant.firebase_tenant_id,
      user: userInTargetTenant,
      tenant: targetTenant,
    };
  }
}
