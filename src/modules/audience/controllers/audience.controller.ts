import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AudienceService } from '../services';
import { CreateAudienceDto, UpdateAudienceDto } from '../dto';
import { FilterAudienceDto } from '../dto/filter-audience.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import {
  ApiCreateAudience,
  ApiGetAudiences,
  ApiGetAudience,
  ApiUpdateAudience,
  ApiDeleteAudience,
} from '../docs';

@ApiTags('audiences')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('audiences')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Post()
  @ApiCreateAudience()
  create(
    @Body() createAudienceDto: CreateAudienceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.audienceService.create(
      createAudienceDto,
      user.id,
      user.tenantId,
    );
  }

  @Get()
  @ApiGetAudiences()
  findAll(@Query() filterDto: FilterAudienceDto) {
    return this.audienceService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetAudience()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.audienceService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateAudience()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ) {
    return this.audienceService.update(id, updateAudienceDto);
  }

  @Delete(':id')
  @ApiDeleteAudience()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.audienceService.remove(id);
  }
}
