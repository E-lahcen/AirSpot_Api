import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@app/modules/auth/guards';
import { AuthenticatedUser, CurrentUser } from '@app/modules/auth/decorators';
import { StoryboardService } from '../services/storyboard.service';
import {
  CreateStoryboardDto,
  UpdateStoryboardDto,
  FilterStoryboardDto,
} from '../dto';

@ApiTags('storyboards')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('storyboards')
export class StoryboardController {
  constructor(private readonly storyboardService: StoryboardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new storyboard' })
  @ApiResponse({
    status: 201,
    description: 'Storyboard created successfully',
  })
  create(
    @Body() createStoryboardDto: CreateStoryboardDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storyboardService.create(
      createStoryboardDto,
      user.id,
      user.tenantId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all storyboards' })
  @ApiResponse({
    status: 200,
    description: 'List of storyboards retrieved successfully',
  })
  findAll(@Query() filterDto: FilterStoryboardDto) {
    return this.storyboardService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a storyboard by ID' })
  @ApiResponse({ status: 200, description: 'Storyboard retrieved' })
  @ApiResponse({ status: 404, description: 'Storyboard not found' })
  findOne(@Param('id') id: string) {
    return this.storyboardService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a storyboard by ID' })
  @ApiResponse({ status: 200, description: 'Storyboard updated' })
  @ApiResponse({ status: 404, description: 'Storyboard not found' })
  update(
    @Param('id') id: string,
    @Body() updateStoryboardDto: UpdateStoryboardDto,
  ) {
    return this.storyboardService.update(id, updateStoryboardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a storyboard by ID' })
  @ApiResponse({ status: 200, description: 'Storyboard deleted' })
  @ApiResponse({ status: 404, description: 'Storyboard not found' })
  remove(@Param('id') id: string) {
    return this.storyboardService.remove(id);
  }
}
