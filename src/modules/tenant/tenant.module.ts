import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './services/tenant.service';
import { TenantConnectionService } from './services/tenant-connection.service';
import { TenantSetupService } from './services/tenant-setup.service';
import { TenantManagementService } from './services/tenant-management.service';
import { TenantMigrationService } from './services/tenant-migration.service';
import { TenantController } from './controllers/tenant.controller';
import { Tenant } from './entities/tenant.entity';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { InvitationModule } from '../invitation/invitation.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    UserModule,
    RoleModule,
    forwardRef(() => InvitationModule),
  ],
  controllers: [TenantController],
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
