import { Injectable, Scope, Inject } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TenantService } from './tenant.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  private queryRunner?: QueryRunner;

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantService: TenantService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async getEntityManager(): Promise<EntityManager> {
    const schema = this.tenantService.getSchema();

    // Create a query runner for this tenant's schema
    if (!this.queryRunner) {
      this.queryRunner = this.dataSource.createQueryRunner();
      await this.queryRunner.connect();
      // Set the search_path to the tenant's schema with public as fallback for extensions
      await this.queryRunner.query(`SET search_path TO "${schema}", public`);
    }

    return this.queryRunner.manager;
  }

  async getRepository<T>(entity: new () => T) {
    const manager = await this.getEntityManager();
    return manager.getRepository(entity);
  }

  async cleanup() {
    if (this.queryRunner) {
      try {
        // Check if query runner is still connected before releasing
        if (this.queryRunner.isReleased === false) {
          await this.queryRunner.release();
        }
      } catch (error) {
        // Log error but don't throw to avoid breaking the response
        console.error('Error releasing query runner:', error);
      } finally {
        this.queryRunner = undefined;
      }
    }
  }
}
