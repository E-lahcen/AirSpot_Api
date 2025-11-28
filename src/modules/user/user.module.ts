import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { RoleModule } from '../role/role.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [RoleModule, FirebaseModule],
  controllers: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
