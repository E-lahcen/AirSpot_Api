import { Global, Module, forwardRef } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UserModule } from '../user/user.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { RoleModule } from '../role/role.module';
import { AuthGuard, RolesGuard } from './guards';

@Global()
@Module({
  imports: [forwardRef(() => UserModule), FirebaseModule, RoleModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthService, FirebaseModule, UserModule],
})
export class AuthModule {}
