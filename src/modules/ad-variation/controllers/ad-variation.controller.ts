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
import { AdVariationService } from '../services';
import { CreateAdVariationDto, UpdateAdVariationDto } from '../dto';
import { FilterAdVariationDto } from '../dto/filter-ad-variation.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import {
  ApiCreateAdVariation,
  ApiGetAdVariations,
  ApiGetAdVariation,
  ApiUpdateAdVariation,
  ApiDeleteAdVariation,
} from '../docs';

@ApiTags('ad-variations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ad-variations')
export class AdVariationController {
  constructor(private readonly adVariationService: AdVariationService) {}

  @Post()
  @ApiCreateAdVariation()
  create(
    @Body() createAdVariationDto: CreateAdVariationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adVariationService.create(
      createAdVariationDto,
      user.id,
      user.tenantId,
    );
  }

  @Get()
  @ApiGetAdVariations()
  findAll(@Query() filterDto: FilterAdVariationDto) {
    return this.adVariationService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetAdVariation()
  findOne(@Param('id') id: string) {
    return this.adVariationService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateAdVariation()
  update(
    @Param('id') id: string,
    @Body() updateAdVariationDto: UpdateAdVariationDto,
  ) {
    return this.adVariationService.update(id, updateAdVariationDto);
  }

  @Delete(':id')
  @ApiDeleteAdVariation()
  remove(@Param('id') id: string) {
    return this.adVariationService.remove(id);
  }
}
