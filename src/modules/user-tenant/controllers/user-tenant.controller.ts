import { Controller, Get, Body, Param, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UserTenantService } from "../services/user-tenant.service";
import { FilterUserTenantDto } from "../dtos/filter-user-tenant.dto";
import { ApiGetUserTenants, ApiGetUserTenant } from "../docs/index";

@ApiTags("user-tenants")
@ApiBearerAuth()
@Controller("user-tenants")
export class UserTenantController {
  constructor(private readonly userTenantService: UserTenantService) {}

  @Get()
  @ApiGetUserTenants()
  findAll(@Query() filterDto: FilterUserTenantDto) {
    return this.userTenantService.findAll(filterDto);
  }

  @Get(":id")
  @ApiGetUserTenant()
  findOne(@Param("id") id: string) {
    return this.userTenantService.findOne(id);
  }
}
