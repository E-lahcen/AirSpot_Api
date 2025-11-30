import { FirebaseService } from '@app/modules/firebase/services/firebase.service';
import { TenantManagementService } from '@app/modules/tenant';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { AuthenticatedUser } from '@app/modules/auth/decorators';

@Injectable()
export class OrganisationService {
  constructor(
    private readonly tenantManagementService: TenantManagementService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async createOrganization(
    createOrganizationDto: CreateOrganizationDto,
    user: AuthenticatedUser,
  ) {
    const existing = await this.tenantManagementService.findByCompanyName(
      createOrganizationDto.name,
    );

    if (existing) {
      throw new ConflictException({
        message: 'Organization already exists!',
        errors: [
          {
            code: 'ORGANIZATION_EXISTS',
            message: 'An organization with this name already exists',
          },
        ],
      });
    }

    // Step 2: Create Firebase tenant with formatted display name
    const firebaseTenant = await this.firebaseService.createTenant(
      createOrganizationDto.name,
    );

    const tenant = await this.tenantManagementService.createTenant({
      companyName: createOrganizationDto.name,
      ownerEmail: user.email,
      firebaseTenantId: firebaseTenant.tenantId,
      ownerId: user.id,
      slug: createOrganizationDto.slug,
      description: createOrganizationDto.description,
      logo: createOrganizationDto.logo,
      region: createOrganizationDto.region,
      defaultRole: createOrganizationDto.defaultRole,
      enforceDomain: createOrganizationDto.enforceDomain ?? false,
      domain: createOrganizationDto.enforceDomain
        ? createOrganizationDto.domain
        : undefined,
    });

    await this.tenantManagementService.setTenantOwner(tenant.id, user.id);

    return tenant;
  }

  async findAllOrganizations() {
    return this.tenantManagementService.getAllTenants();
  }
}
