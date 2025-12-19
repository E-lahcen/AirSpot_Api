import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './core/validators';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common/interfaces/nest-application.interface';
import { TypeOrmErrorsFilter } from './core/filters/typeorm-errors.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { VersioningType } from '@nestjs/common/enums/version-type.enum';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as packages from '../package.json';

interface AppConfig {
  env: ConfigService<EnvironmentVariables, true>;
  globalPrefix: string;
  defaultVersion: string;
}

function setupGlobalMiddlewares(appConfig: AppConfig) {
  const { globalPrefix, defaultVersion, env } = appConfig;

  return function (app: INestApplication) {
    const isApiLoggingEnabled = env.get('API_LOGGING') === 'true';

    app
      .setGlobalPrefix(globalPrefix)
      .useGlobalFilters(new TypeOrmErrorsFilter())
      .useGlobalInterceptors(
        new LoggingInterceptor(env.get('NODE_ENV'), isApiLoggingEnabled),
      )
      .useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      )
      .enableVersioning({
        type: VersioningType.URI,
        defaultVersion,
      });
    return app;
  };
}

function startServer(appConfig: AppConfig) {
  const { globalPrefix, defaultVersion, env } = appConfig;
  const port = Number(env.get('PORT', '3000'));
  return async function (app: INestApplication) {
    await app.listen(port, '0.0.0.0').then(() => {
      const logger = new Logger('Bootstrap');
      logger.log(
        `🚀 Application is now running on: http://localhost:${port}/${globalPrefix}/v${defaultVersion}`,
      );
      logger.log(
        `🚀 Application swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`,
      );
    });
    return app;
  };
}

function setupSwagger(app: INestApplication): INestApplication {
  const config = new DocumentBuilder()
    .setTitle('Airspot API')
    .setDescription('API documentation for the Airspot Services.')
    .setVersion((packages as { version: string }).version)
    .addBearerAuth({ type: 'http' })
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-tenant-slug',
        in: 'header',
        description: 'Tenant identifier for multi-tenancy isolation',
      },
      'x-tenant-slug',
    )
    .addTag('Airspot Services')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs/json',
  });
  return app;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    // Enable graceful shutdown to properly close connections
    app.enableShutdownHooks();

    const env =
      app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

    // Enable CORS for external frontends
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-tenant-slug',
        'Accept',
        'Origin',
        'X-Requested-With',
      ],
    });

    const config = {
      env,
      defaultVersion: '1',
      globalPrefix: 'api',
    };

    const pipeline = [
      setupGlobalMiddlewares(config),
      setupSwagger,
      startServer(config),
    ];

    await pipeline.reduce(
      async (appPromise, setup) => setup(await appPromise),
      Promise.resolve(app),
    );
  } catch (error) {
    logger.error('Failed to bootstrap application', error);
    throw error;
  }
}
bootstrap().catch((error) => {
  const logger = new Logger('BootstrapError');
  logger.error('Error during application bootstrap', error);
  process.exit(1);
});
