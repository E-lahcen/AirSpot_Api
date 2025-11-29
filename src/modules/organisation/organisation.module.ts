import { Module } from '@nestjs/common';
import { OrganisationService } from './services/organisation.service';
import { OrganisationController } from './controllers/organisation.controller';
@Module({
  providers: [OrganisationService],
  controllers: [OrganisationController]
})
export class OrganisationModule {}
