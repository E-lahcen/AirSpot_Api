import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { TaskTemplate, TaskType } from '../entities/task-template.entity';
import { Task, TaskStatus } from '../../task/entities/task.entity';
import {
  CreateTaskTemplateDto,
  UpdateTaskTemplateDto,
  ApplyTemplateDto,
} from '../dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';

@Injectable()
export class TaskTemplateService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createTaskTemplateDto: CreateTaskTemplateDto,
    organization_id: string,
  ): Promise<TaskTemplate> {
    const templateRepository =
      await this.tenantConnection.getRepository(TaskTemplate);

    const template = templateRepository.create({
      ...createTaskTemplateDto,
      organization_id,
    });

    return await templateRepository.save(template);
  }

  async findAll(
    organization_id: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    task_type?: string,
  ): Promise<Pagination<TaskTemplate>> {
    const templateRepository =
      await this.tenantConnection.getRepository(TaskTemplate);

    const where: FindOptionsWhere<TaskTemplate> = { organization_id };

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (task_type) {
      where.task_type = task_type as TaskType;
    }

    const queryBuilder = templateRepository
      .createQueryBuilder('task_template')
      .where(where)
      .orderBy('task_template.created_at', 'DESC');

    return paginate<TaskTemplate>(queryBuilder, { page, limit });
  }

  async findOne(id: string, organization_id: string): Promise<TaskTemplate> {
    const templateRepository =
      await this.tenantConnection.getRepository(TaskTemplate);

    const template = await templateRepository.findOne({
      where: { id, organization_id },
    });

    if (!template) {
      throw new NotFoundException(`Task template with ID ${id} not found`);
    }

    return template;
  }

  async update(
    id: string,
    updateTaskTemplateDto: UpdateTaskTemplateDto,
    organization_id: string,
  ): Promise<TaskTemplate> {
    const templateRepository =
      await this.tenantConnection.getRepository(TaskTemplate);

    const template = await this.findOne(id, organization_id);

    Object.assign(template, updateTaskTemplateDto);

    return await templateRepository.save(template);
  }

  async remove(id: string, organization_id: string): Promise<void> {
    const templateRepository =
      await this.tenantConnection.getRepository(TaskTemplate);

    const template = await this.findOne(id, organization_id);

    await templateRepository.remove(template);
  }

  async applyTemplate(
    applyTemplateDto: ApplyTemplateDto,
    organization_id: string,
  ): Promise<Task[]> {
    const template = await this.findOne(
      applyTemplateDto.template_id,
      organization_id,
    );

    // Validate that the correct related ID is provided
    if (
      template.task_type === TaskType.CAMPAIGN &&
      !applyTemplateDto.related_campaign_id
    ) {
      throw new BadRequestException(
        'related_campaign_id is required for Campaign templates',
      );
    }

    if (
      template.task_type === TaskType.CREATIVE &&
      !applyTemplateDto.related_creative_id
    ) {
      throw new BadRequestException(
        'related_creative_id is required for Creative templates',
      );
    }

    const taskRepository = await this.tenantConnection.getRepository(Task);

    const baseDate = new Date(applyTemplateDto.base_date);
    const createdTasks: Task[] = [];

    for (const taskItem of template.tasks) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + taskItem.daysUntilDue);

      const task = taskRepository.create({
        name: taskItem.name,
        description: taskItem.description,
        priority: taskItem.priority,
        status: TaskStatus.TODO,
        due_date: dueDate,
        assigned_user_id: applyTemplateDto.assigned_user_id,
        related_campaign_id: applyTemplateDto.related_campaign_id || null,
        related_creative_id: applyTemplateDto.related_creative_id || null,
        organization_id,
      });

      createdTasks.push(await taskRepository.save(task));
    }

    return createdTasks;
  }
}
