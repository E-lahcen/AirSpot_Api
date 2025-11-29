import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvironmentVariables, validateEnvVariables } from './core/validators';
import { CoreModule } from './core/core.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantModule, TenantMiddleware } from './modules/tenant';
import { TenantMigrationService } from './modules/tenant/services/tenant-migration.service';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { CreativeModule } from './modules/creative/creative.module';
import { AdVariationModule } from './modules/ad-variation/ad-variation.module';
import { AudienceModule } from './modules/audience/audience.module';
import { VideoDownloadModule } from './modules/video-download/video-download.module';
import { TemplateModule } from './modules/template/template.module';
import { StoryboardModule } from './modules/storyboard/storyboard.module';
import { OrganisationModule } from './modules/organisation/organisation.module';
import { UserTenantModule } from './modules/user-tenant/user-tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvVariables,
    }),
    CoreModule,
    FirebaseModule,
    TenantModule,
    AuthModule,
    CampaignModule,
    CreativeModule,
    AdVariationModule,
    AudienceModule,
    VideoDownloadModule,
    TemplateModule,
    StoryboardModule,
    OrganisationModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => ({
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        database: configService.get<string>('DB_NAME'),
        logging: true,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        synchronize: false,
        type: 'postgres',
        cache: true,
        autoLoadEntities: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/[0-9]*-*.{ts,js}'],
        migrationsRun: true,
        // Connection pool configuration to prevent connection exhaustion
        extra: {
          max: 20, // Maximum number of connections in pool
          min: 2, // Minimum number of connections in pool
          idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
          connectionTimeoutMillis: 5000, // Timeout for acquiring connection (5 seconds)
        },
        // Query timeout to prevent long-running queries from holding connections
        maxQueryExecutionTime: 10000, // Log queries that take longer than 10 seconds
      }),
    }),
    UserTenantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private readonly tenantMigrationService: TenantMigrationService,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Running tenant schema migrations on startup...');
    try {
      const results =
        await this.tenantMigrationService.runMigrationsForAllTenants();

      if (results.success.length > 0) {
        this.logger.log(
          `✅ Tenant migrations completed: ${results.success.length} tenant(s)`,
        );
      }

      if (results.failed.length > 0) {
        this.logger.warn(
          `⚠️  Tenant migrations failed for: ${results.failed.join(', ')}`,
        );
      }

      if (results.success.length === 0 && results.failed.length === 0) {
        this.logger.log('✅ No tenant migrations needed');
      }

      // Ensure storyboards table exists for all tenants (safety check)
      this.logger.log(
        '🔄 Ensuring storyboards table exists for all tenants...',
      );
      try {
        await this.tenantMigrationService.ensureStoryboardsTableForAllTenants();
        this.logger.log('✅ Storyboards table check completed');
      } catch (error) {
        this.logger.error('❌ Error ensuring storyboards table', error);
        // Don't throw - allow app to start even if this fails
      }
    } catch (error) {
      this.logger.error('❌ Error running tenant migrations on startup', error);
      // Don't throw - allow app to start even if migrations fail
    }
  }

  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes except health checks, docs, auth registration/login, and public template/video files
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: '/docs/', method: RequestMethod.ALL },
        { path: '/auth/register', method: RequestMethod.POST, version: '1' },
        { path: '/auth/login', method: RequestMethod.POST, version: '1' },
        { path: '/user-tenants', method: RequestMethod.GET, version: '1' },
        { path: '/user-tenants/:id', method: RequestMethod.GET, version: '1' },
        {
          path: '/auth/exchange-token',
          method: RequestMethod.POST,
          version: '1',
        },
        {
          path: '/templates/public',
          method: RequestMethod.ALL,
          version: '1',
        },
        {
          path: '/video-download/public',
          method: RequestMethod.ALL,
          version: '1',
        },
      )
      .forRoutes('/');
  }
}
