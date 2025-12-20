import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { randomUUID } from 'crypto';
import {
  CreateTemplateStoryboardDto,
  UpdateTemplateStoryboardDto,
  FilterTemplateStoryboardDto,
} from '../dto';
import { TemplateStoryboard } from '../entities/template-storyboard.entity';

@Injectable()
export class TemplateStoryboardService {
  constructor(
    @InjectRepository(TemplateStoryboard)
    private readonly templateStoryboardRepository: Repository<TemplateStoryboard>,
  ) {}

  async create(
    createTemplateStoryboardDto: CreateTemplateStoryboardDto,
  ): Promise<TemplateStoryboard> {
    const templateStoryboard = this.templateStoryboardRepository.create({
      id: createTemplateStoryboardDto.id || randomUUID(),
      title: createTemplateStoryboardDto.title,
      duration: createTemplateStoryboardDto.duration,
      scenes: createTemplateStoryboardDto.scenes,
      scenes_data: createTemplateStoryboardDto.scenesData || [],
      video_url: createTemplateStoryboardDto.videoUrl,
      imageHistory: createTemplateStoryboardDto.imageHistory || null,
      description: createTemplateStoryboardDto.description || null,
      industry: createTemplateStoryboardDto.industry || null,
    });

    return this.templateStoryboardRepository.save(templateStoryboard);
  }

  async findAll(
    filterDto: FilterTemplateStoryboardDto,
  ): Promise<Pagination<TemplateStoryboard>> {
    // Create query builder and explicitly set it to query from public schema
    const queryBuilder = this.templateStoryboardRepository
      .createQueryBuilder('template_storyboard')
      .setQueryRunner(
        this.templateStoryboardRepository.manager.connection.createQueryRunner(),
      );

    // Use raw SQL to ensure we query from public schema
    await queryBuilder.connection.query('SET search_path TO public');

    if (filterDto?.title) {
      queryBuilder.where('template_storyboard.title ILIKE :title', {
        title: `%${filterDto.title}%`,
      });
    }

    queryBuilder.orderBy('template_storyboard.created_at', 'DESC');

    const result = await paginate<TemplateStoryboard>(queryBuilder, {
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
    });

    // Reset search path
    await queryBuilder.connection.query('RESET search_path');

    return result;
  }

  async findOne(id: string): Promise<TemplateStoryboard> {
    // Since entity has schema: 'public', this will query public.template_storyboards
    const templateStoryboard = await this.templateStoryboardRepository.findOne({
      where: { id },
    });

    if (!templateStoryboard) {
      throw new NotFoundException(
        `Template storyboard with ID ${id} not found`,
      );
    }

    return templateStoryboard;
  }

  async update(
    id: string,
    updateTemplateStoryboardDto: UpdateTemplateStoryboardDto,
  ): Promise<TemplateStoryboard> {
    const templateStoryboard = await this.findOne(id);

    const updateData: Partial<TemplateStoryboard> = {};

    if (updateTemplateStoryboardDto.title !== undefined) {
      updateData.title = updateTemplateStoryboardDto.title;
    }
    if (updateTemplateStoryboardDto.duration !== undefined) {
      updateData.duration = updateTemplateStoryboardDto.duration;
    }
    if (updateTemplateStoryboardDto.scenes !== undefined) {
      updateData.scenes = updateTemplateStoryboardDto.scenes;
    }
    if (updateTemplateStoryboardDto.scenesData !== undefined) {
      updateData.scenes_data = updateTemplateStoryboardDto.scenesData;
    }
    if (updateTemplateStoryboardDto.videoUrl !== undefined) {
      updateData.video_url = updateTemplateStoryboardDto.videoUrl;
    }
    if (updateTemplateStoryboardDto.imageHistory !== undefined) {
      updateData.imageHistory = updateTemplateStoryboardDto.imageHistory;
    }
    if (updateTemplateStoryboardDto.description !== undefined) {
      updateData.description = updateTemplateStoryboardDto.description;
    }
    if (updateTemplateStoryboardDto.industry !== undefined) {
      updateData.industry = updateTemplateStoryboardDto.industry;
    }

    Object.assign(templateStoryboard, updateData);

    return this.templateStoryboardRepository.save(templateStoryboard);
  }

  async remove(id: string): Promise<void> {
    const templateStoryboard = await this.findOne(id);
    await this.templateStoryboardRepository.remove(templateStoryboard);
  }
}
