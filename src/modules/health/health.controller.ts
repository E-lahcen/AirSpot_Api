import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  check() {
    const isConnected = this.dataSource.isInitialized;

    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
      },
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connection health' })
  async checkDatabase() {
    try {
      // Execute a simple query to verify connection
      await this.dataSource.query('SELECT 1');

      // Get connection pool stats if available
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const driver = this.dataSource.driver as any;

      const poolSize: string | number =
        (driver.master?.totalCount as number | undefined) || 'N/A';

      const idleConnections: string | number =
        (driver.master?.idleCount as number | undefined) || 'N/A';

      const waitingClients: string | number =
        (driver.master?.waitingCount as number | undefined) || 'N/A';
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          pool: {
            total: poolSize,
            idle: idleConnections,
            waiting: waitingClients,
          },
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: errorMessage,
        },
      };
    }
  }
}
