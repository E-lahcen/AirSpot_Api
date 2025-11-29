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
    UserTenantModule,
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
      }),
    }),
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
    } catch (error) {
      this.logger.error('❌ Error running tenant migrations on startup', error);
      // Don't throw - allow app to start even if migrations fail
    }
  }

  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes except health checks, docs, and auth registration/login
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: '/docs/', method: RequestMethod.ALL },
        { path: '/auth/register', method: RequestMethod.POST, version: '1' },
        { path: '/auth/login', method: RequestMethod.POST, version: '1' },
        { path: '/user-tenants', method: RequestMethod.GET, version: '1' },
        {
          path: '/auth/exchange-token',
          method: RequestMethod.POST,
          version: '1',
        },
      )
      .forRoutes('/');
  }
}
