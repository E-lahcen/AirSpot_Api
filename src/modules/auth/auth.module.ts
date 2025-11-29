import { Global, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UserModule } from '../user/user.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { RoleModule } from '../role/role.module';
import { AuthGuard, RolesGuard } from './guards';
import { UserTenantModule } from '../user-tenant/user-tenant.module';

@Global()
@Module({
  imports: [UserModule, FirebaseModule, RoleModule, UserTenantModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthService, FirebaseModule, UserModule],
})
export class AuthModule {}
