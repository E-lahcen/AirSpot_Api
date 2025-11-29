import { TenantManagementService } from '@app/modules/tenant';
import { ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class OrganisationService {
    constructor(private readonly tenantManagementService: TenantManagementService){}

    async createOrganization(dto: any, user: any) {
        const existing = await this.tenantManagementService.findByCompanyName(
          dto.name,
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

        
    
        const tenant = await this.tenantManagementService.createTenant({
          companyName: dto.name,
          ownerEmail: user.email,
          firebaseTenantId: user.firebaseTenantId,
          ownerId: user.id,
          slug: dto.slug,
          description: dto.description,
          logo: dto.logo,
          region: dto.region,
          defaultRole: dto.defaultRole,
          enforceDomain: dto.enforceDomain ?? false,
          domain: dto.enforceDomain ? dto.domain : undefined,
        });
    
        return {
          message: 'Organization created successfully',
          tenant,
        };
    }
}
