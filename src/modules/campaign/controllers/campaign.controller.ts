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
import { CampaignService } from '../services';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { FilterCampaignDto } from '../dto/filter-campaign.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import {
  ApiCreateCampaign,
  ApiGetCampaigns,
  ApiGetCampaign,
  ApiUpdateCampaign,
  ApiDeleteCampaign,
} from '../docs';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiCreateCampaign()
  create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignService.create(
      createCampaignDto,
      user.id,
      user.tenantId,
    );
  }

  @Get()
  @ApiGetCampaigns()
  findAll(@Query() filterDto: FilterCampaignDto) {
    return this.campaignService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetCampaign()
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateCampaign()
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiDeleteCampaign()
  remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }
}
