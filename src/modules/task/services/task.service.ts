import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Task, TaskStatus, Priority } from '../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from '../dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createTaskDto: CreateTaskDto,
    organization_id: string,
  ): Promise<Task> {
    const taskRepository = await this.tenantConnection.getRepository(Task);

    const taskData = {
      name: createTaskDto.name,
      description: createTaskDto.description || '',
      organization_id,
      related_campaign_id: createTaskDto.related_campaign_id || null,
      related_creative_id: createTaskDto.related_creative_id || null,
      assigned_user_id: createTaskDto.assigned_user_id || null,
      status: createTaskDto.status || TaskStatus.TODO,
      priority: createTaskDto.priority || Priority.MEDIUM,
      due_date: createTaskDto.due_date
        ? new Date(createTaskDto.due_date)
        : null,
      last_updated: createTaskDto.last_updated
        ? new Date(createTaskDto.last_updated)
        : new Date(),
    };

    const task = taskRepository.create(taskData);

    const savedTask = await taskRepository.save(task);

    // Fetch the task with all relations
    const taskWithRelations = await taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['campaign', 'creative', 'assigned_user'],
    });

    if (!taskWithRelations) {
      throw new NotFoundException('Task not found after creation');
    }

    return taskWithRelations;
  }

  async findAll(
    organization_id: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    priority?: string,
    campaign_id?: string,
    creative_id?: string,
    assigned_user_id?: string,
  ): Promise<Pagination<Task>> {
    const taskRepository = await this.tenantConnection.getRepository(Task);

    const where: FindOptionsWhere<Task> = { organization_id };

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (status) {
      where.status = status as TaskStatus;
    }

    if (priority) {
      where.priority = priority as Priority;
    }

    if (campaign_id) {
      where.related_campaign_id = campaign_id;
    }

    if (creative_id) {
      where.related_creative_id = creative_id;
    }

    if (assigned_user_id) {
      where.assigned_user_id = assigned_user_id;
    }

    const queryBuilder = taskRepository
      .createQueryBuilder('task')
      .where(where)
      .leftJoinAndSelect('task.campaign', 'campaign')
      .leftJoinAndSelect('task.creative', 'creative')
      .leftJoinAndSelect('task.assigned_user', 'user')
      .orderBy('task.due_date', 'ASC')
      .addOrderBy('task.created_at', 'DESC');

    return paginate<Task>(queryBuilder, { page, limit });
  }

  async findOne(id: string, organization_id: string): Promise<Task> {
    const taskRepository = await this.tenantConnection.getRepository(Task);

    const task = await taskRepository.findOne({
      where: { id, organization_id },
      relations: ['campaign', 'creative', 'assigned_user'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    organization_id: string,
  ): Promise<Task> {
    const taskRepository = await this.tenantConnection.getRepository(Task);

    const task = await this.findOne(id, organization_id);

    const updateData: any = { ...updateTaskDto };

    if (updateTaskDto.due_date) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.due_date = new Date(updateTaskDto.due_date);
    }

    Object.assign(task, updateData);

    return await taskRepository.save(task);
  }

  async remove(id: string, organization_id: string): Promise<void> {
    const taskRepository = await this.tenantConnection.getRepository(Task);

    const task = await this.findOne(id, organization_id);

    await taskRepository.remove(task);
  }

  async getStatistics(organization_id: string): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const taskRepository = await this.tenantConnection.getRepository(Task);

    const [total, todo, inProgress, completed] = await Promise.all([
      taskRepository.count({ where: { organization_id } }),
      taskRepository.count({
        where: { organization_id, status: TaskStatus.TODO },
      }),
      taskRepository.count({
        where: { organization_id, status: TaskStatus.IN_PROGRESS },
      }),
      taskRepository.count({
        where: { organization_id, status: TaskStatus.COMPLETED },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = await taskRepository
      .createQueryBuilder('task')
      .where('task.organization_id = :organization_id', { organization_id })
      .andWhere('task.status != :completed', {
        completed: TaskStatus.COMPLETED,
      })
      .andWhere('task.due_date < :today', { today })
      .getCount();

    return {
      total,
      todo,
      inProgress,
      completed,
      overdue,
    };
  }
}
