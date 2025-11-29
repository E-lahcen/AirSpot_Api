import { Injectable, Scope, Inject, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TenantService } from './tenant.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService implements OnModuleDestroy {
  private queryRunner?: QueryRunner;

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantService: TenantService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    // Setup cleanup on request end
    this.request.on('close', () => {
      this.cleanup().catch((error) => {
        console.error('Error during request cleanup:', error);
      });
    });
  }

  async getEntityManager(): Promise<EntityManager> {
    const schema = this.tenantService.getSchema();

    // Release existing query runner if schema changed
    if (this.queryRunner && !this.queryRunner.isReleased) {
      try {
        await this.queryRunner.release();
      } catch (error) {
        console.warn('Error releasing previous query runner:', error);
      }
      this.queryRunner = undefined;
    }

    // Create a new query runner if needed
    if (!this.queryRunner || this.queryRunner.isReleased) {
      this.queryRunner = this.dataSource.createQueryRunner();
      await this.queryRunner.connect();
      // Set the search_path to the tenant's schema
      await this.queryRunner.query(`SET search_path TO "${schema}"`);
    }

    return this.queryRunner.manager;
  }

  async getRepository<T>(entity: new () => T) {
    const manager = await this.getEntityManager();
    return manager.getRepository(entity);
  }

  async cleanup(): Promise<void> {
    if (this.queryRunner && !this.queryRunner.isReleased) {
      try {
        await this.queryRunner.release();
      } catch (error) {
        console.error('Error releasing query runner during cleanup:', error);
      } finally {
        this.queryRunner = undefined;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
  }
}
