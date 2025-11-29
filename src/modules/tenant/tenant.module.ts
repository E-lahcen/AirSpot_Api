import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './services/tenant.service';
import { TenantConnectionService } from './services/tenant-connection.service';
import { TenantSetupService } from './services/tenant-setup.service';
import { TenantManagementService } from './services/tenant-management.service';
import { TenantMigrationService } from './services/tenant-migration.service';
import { Tenant } from './entities/tenant.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [
    TenantService,
    TenantConnectionService,
    TenantSetupService,
    TenantManagementService,
    TenantMigrationService,
  ],
  exports: [
    TenantService,
    TenantConnectionService,
    TenantManagementService,
    TenantMigrationService,
  ],
})
export class TenantModule {}
