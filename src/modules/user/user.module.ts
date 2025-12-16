import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './services/user.service';
import { UserManagementService } from './services/user-management.service';
import { UserController } from './controllers/user.controller';
import { RoleModule } from '../role/role.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationModule } from '../notification/notification.module';
import { UserTenant } from '../user-tenant/entities/user-tenant.entity';
import { Invitation } from '../invitation/entities/invitation.entity';
import { Tenant } from '../tenant/entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTenant, Invitation, Tenant]),
    RoleModule,
    FirebaseModule,
    NotificationModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserManagementService],
  exports: [UserService, UserManagementService],
})
export class UserModule {}
