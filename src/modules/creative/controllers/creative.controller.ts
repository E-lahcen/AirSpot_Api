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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreativeService } from '../services';
import { CreateCreativeDto, UpdateCreativeDto } from '../dto';
import { FilterCreativeDto } from '../dto/filter-creative.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import {
  ApiCreateCreative,
  ApiGetCreatives,
  ApiGetCreative,
  ApiUpdateCreative,
  ApiDeleteCreative,
} from '../docs';

@ApiTags('creatives')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('creatives')
export class CreativeController {
  constructor(private readonly creativeService: CreativeService) {}

  @Post()
  @ApiCreateCreative()
  create(
    @Body() createCreativeDto: CreateCreativeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.creativeService.create(
      createCreativeDto,
      user.id,
      user.tenantId,
      user,
    );
  }

  @Get()
  @ApiGetCreatives()
  findAll(@Query() filterDto: FilterCreativeDto) {
    return this.creativeService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetCreative()
  findOne(@Param('id') id: string) {
    return this.creativeService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateCreative()
  update(
    @Param('id') id: string,
    @Body() updateCreativeDto: UpdateCreativeDto,
  ) {
    return this.creativeService.update(id, updateCreativeDto);
  }

  @Delete(':id')
  @ApiDeleteCreative()
  remove(@Param('id') id: string) {
    return this.creativeService.remove(id);
  }
}
