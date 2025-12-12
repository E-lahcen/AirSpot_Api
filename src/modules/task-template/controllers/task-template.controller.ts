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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskTemplateService } from '../services/task-template.service';
import {
  CreateTaskTemplateDto,
  UpdateTaskTemplateDto,
  ApplyTemplateDto,
} from '../dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';

@ApiTags('task-templates')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('task-templates')
export class TaskTemplateController {
  constructor(private readonly taskTemplateService: TaskTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task template' })
  create(
    @Body() createTaskTemplateDto: CreateTaskTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.taskTemplateService.create(
      createTaskTemplateDto,
      user.tenantId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all task templates with pagination and filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'task_type', required: false, type: String })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('task_type') task_type?: string,
  ) {
    return this.taskTemplateService.findAll(
      user.tenantId,
      page,
      limit,
      search,
      task_type,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task template by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.taskTemplateService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task template' })
  update(
    @Param('id') id: string,
    @Body() updateTaskTemplateDto: UpdateTaskTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.taskTemplateService.update(
      id,
      updateTaskTemplateDto,
      user.tenantId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task template' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.taskTemplateService.remove(id, user.tenantId);
  }

  @Post('apply')
  @ApiOperation({
    summary: 'Apply a template to create multiple tasks',
    description:
      'Creates tasks based on a template with calculated due dates relative to a base date',
  })
  applyTemplate(
    @Body() applyTemplateDto: ApplyTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.taskTemplateService.applyTemplate(
      applyTemplateDto,
      user.tenantId,
    );
  }
}
