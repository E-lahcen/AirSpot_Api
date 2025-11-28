import { Module } from '@nestjs/common';
import { RoleService } from './services';

@Module({
  imports: [],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
