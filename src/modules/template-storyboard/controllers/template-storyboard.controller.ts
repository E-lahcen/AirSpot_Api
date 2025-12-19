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
import { AuthGuard, RolesGuard } from '@app/modules/auth/guards';
import { Roles, SkipTenant } from '@app/modules/auth/decorators';
import { TemplateStoryboardService } from '../services/template-storyboard.service';
import {
  CreateTemplateStoryboardDto,
  UpdateTemplateStoryboardDto,
  FilterTemplateStoryboardDto,
} from '../dto';

@ApiTags('template-storyboards')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@SkipTenant()
@Controller('template-storyboards')
export class TemplateStoryboardController {
  constructor(
    private readonly templateStoryboardService: TemplateStoryboardService,
  ) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Create a new template storyboard (Super Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Template storyboard created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  create(@Body() createTemplateStoryboardDto: CreateTemplateStoryboardDto) {
    return this.templateStoryboardService.create(createTemplateStoryboardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all template storyboards' })
  @ApiResponse({
    status: 200,
    description: 'List of template storyboards retrieved successfully',
  })
  findAll(@Query() filterDto: FilterTemplateStoryboardDto) {
    return this.templateStoryboardService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template storyboard by ID' })
  @ApiResponse({ status: 200, description: 'Template storyboard retrieved' })
  @ApiResponse({ status: 404, description: 'Template storyboard not found' })
  findOne(@Param('id') id: string) {
    return this.templateStoryboardService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Update a template storyboard by ID (Super Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Template storyboard updated' })
  @ApiResponse({ status: 404, description: 'Template storyboard not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  update(
    @Param('id') id: string,
    @Body() updateTemplateStoryboardDto: UpdateTemplateStoryboardDto,
  ) {
    return this.templateStoryboardService.update(
      id,
      updateTemplateStoryboardDto,
    );
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Delete a template storyboard by ID (Super Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Template storyboard deleted' })
  @ApiResponse({ status: 404, description: 'Template storyboard not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  remove(@Param('id') id: string) {
    return this.templateStoryboardService.remove(id);
  }
}
