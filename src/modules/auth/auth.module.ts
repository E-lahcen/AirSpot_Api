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
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';

@Global()
@Module({
  imports: [
    UserModule,
    RoleModule,
    UserTenantModule,
    FirebaseModule,
    NotificationModule,
    TypeOrmModule.forFeature([EmailVerification]),
    PassportModule.register({ defaultStrategy: 'google' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, GoogleStrategy],
  exports: [
    AuthService,
    UserModule,
    FirebaseModule,
    RoleModule,
    UserTenantModule,
  ],
})
export class AuthModule {}
