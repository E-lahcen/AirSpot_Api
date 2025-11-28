import { Module, forwardRef } from '@nestjs/common';
import { InvitationService } from './services/invitation.service';
import { EmailService } from './services/email.service';
import { InvitationController } from './controllers';
import { RoleModule } from '../role/role.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [RoleModule, forwardRef(() => TenantModule)],
  controllers: [InvitationController],
  providers: [InvitationService, EmailService],
  exports: [InvitationService, EmailService],
})
export class InvitationModule {}
