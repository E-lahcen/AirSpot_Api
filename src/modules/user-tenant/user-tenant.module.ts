import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTenant } from './entities/user-tenant.entity';
import { UserTenantService } from './services/user-tenant.service';
import { UserTenantController } from './controllers/user-tenant.controller';
import { TenantModule } from '../tenant';

@Module({
  imports: [TypeOrmModule.forFeature([UserTenant]), TenantModule],
  controllers: [UserTenantController],
  providers: [UserTenantService],
  exports: [UserTenantService],
})
export class UserTenantModule {}
