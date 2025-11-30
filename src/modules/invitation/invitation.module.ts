import { Module } from "@nestjs/common";
import { InvitationService } from "./services/invitation.service";
import { InvitationController } from "./controllers/invitation.controller";
import { NotificationModule } from "../notification/notification.module";
import { InvitationTemplateService } from "./services/invitation-template.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationTemplateService],
  exports: [InvitationService],
})
export class InvitationModule {}
