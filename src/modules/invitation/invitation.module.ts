import { Module } from '@nestjs/common';
import { InvitationService } from './services/invitation.service';
import { EmailService } from './services/email.service';
import { InvitationController } from './controllers';
import { RoleModule } from '../role/role.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [RoleModule, TenantModule],
  controllers: [InvitationController],
  providers: [InvitationService, EmailService],
  exports: [InvitationService, EmailService],
})
export class InvitationModule {}
