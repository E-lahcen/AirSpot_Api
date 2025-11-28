import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  CreateStoryboardDto,
  UpdateStoryboardDto,
  FilterStoryboardDto,
} from '../dto';
import { Storyboard } from '../entities/storyboard.entity';

@Injectable()
export class StoryboardService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createStoryboardDto: CreateStoryboardDto,
    owner_id: string,
    organization_id: string,
  ): Promise<Storyboard> {
    const storyboardRepository =
      await this.tenantConnection.getRepository(Storyboard);

    const storyboard = storyboardRepository.create({
      id: createStoryboardDto.id || randomUUID(),
      organization_id,
      owner_id,
      title: createStoryboardDto.title,
      duration: createStoryboardDto.duration,
      scenes: createStoryboardDto.scenes,
      scenes_data: createStoryboardDto.scenesData || [],
      video_url: createStoryboardDto.videoUrl,
    });

    return storyboardRepository.save(storyboard);
  }

  async findAll(
    filterDto: FilterStoryboardDto,
  ): Promise<Pagination<Storyboard>> {
    const storyboardRepository =
      await this.tenantConnection.getRepository(Storyboard);

    const where: FindOptionsWhere<Storyboard> = {};

    if (filterDto?.title) {
      where.title = Like(`%${filterDto.title}%`);
    }

    const queryBuilder = storyboardRepository
      .createQueryBuilder('storyboard')
      .orderBy('storyboard.created_at', 'DESC');

    if (Object.keys(where).length > 0) {
      queryBuilder.where(where);
    }

    return paginate<Storyboard>(queryBuilder, {
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
    });
  }

  async findOne(id: string): Promise<Storyboard> {
    const storyboardRepository =
      await this.tenantConnection.getRepository(Storyboard);

    const storyboard = await storyboardRepository.findOne({ where: { id } });

    if (!storyboard) {
      throw new NotFoundException(`Storyboard with ID ${id} not found`);
    }

    return storyboard;
  }

  async update(
    id: string,
    updateStoryboardDto: UpdateStoryboardDto,
  ): Promise<Storyboard> {
    const storyboard = await this.findOne(id);
    const storyboardRepository =
      await this.tenantConnection.getRepository(Storyboard);

    const updateData: Partial<Storyboard> = {};

    if (updateStoryboardDto.title !== undefined) {
      updateData.title = updateStoryboardDto.title;
    }
    if (updateStoryboardDto.duration !== undefined) {
      updateData.duration = updateStoryboardDto.duration;
    }
    if (updateStoryboardDto.scenes !== undefined) {
      updateData.scenes = updateStoryboardDto.scenes;
    }
    if (updateStoryboardDto.scenesData !== undefined) {
      updateData.scenes_data = updateStoryboardDto.scenesData;
    }
    if (updateStoryboardDto.videoUrl !== undefined) {
      updateData.video_url = updateStoryboardDto.videoUrl;
    }

    Object.assign(storyboard, updateData);

    return storyboardRepository.save(storyboard);
  }

  async remove(id: string): Promise<void> {
    const storyboard = await this.findOne(id);
    const storyboardRepository =
      await this.tenantConnection.getRepository(Storyboard);
    await storyboardRepository.remove(storyboard);
  }
}
