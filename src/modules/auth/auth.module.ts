import { Global, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { AuthGuard, RolesGuard } from './guards';
import { UserTenantModule } from '../user-tenant/user-tenant.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationModule } from '../notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './entities/email-verification.entity';

@Global()
@Module({
  imports: [
    UserModule,
    RoleModule,
    UserTenantModule,
    FirebaseModule,
    NotificationModule,
    TypeOrmModule.forFeature([EmailVerification]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [
    AuthService,
    UserModule,
    FirebaseModule,
    RoleModule,
    UserTenantModule,
  ],
})
export class AuthModule {}
