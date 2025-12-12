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
import { TaskService } from '../services/task.service';
import { CreateTaskDto, UpdateTaskDto } from '../dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.taskService.create(createTaskDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'campaign_id', required: false, type: String })
  @ApiQuery({ name: 'creative_id', required: false, type: String })
  @ApiQuery({ name: 'assigned_user_id', required: false, type: String })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('campaign_id') campaign_id?: string,
    @Query('creative_id') creative_id?: string,
    @Query('assigned_user_id') assigned_user_id?: string,
  ) {
    return this.taskService.findAll(
      user.tenantId,
      page,
      limit,
      search,
      status,
      priority,
      campaign_id,
      creative_id,
      assigned_user_id,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get task statistics' })
  getStatistics(@CurrentUser() user: AuthenticatedUser) {
    return this.taskService.getStatistics(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.taskService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.taskService.update(id, updateTaskDto, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.taskService.remove(id, user.tenantId);
  }
}
