import { Expose, plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

import { Environment } from 'src/common/enums';

export class EnvironmentVariables {
  @IsEnum(Environment)
  @Expose()
  NODE_ENV: `${Environment}`;

  @IsString()
  @Expose()
  PORT: string;

  @IsString()
  @Expose()
  DB_USERNAME: string;

  @IsString()
  @Expose()
  DB_PASSWORD: string;

  @IsString()
  @Expose()
  DB_NAME: string;

  @IsEnum(['postgres'])
  @Expose()
  DB_TYPE: 'postgres';

  @IsString()
  @Expose()
  DB_HOST: string;

  @IsNumber()
  @Expose()
  @Transform((item) => parseInt(item.value as string, 10))
  DB_PORT: number;

  @IsString()
  @Expose()
  REDIS_HOST: string;

  @IsNumber()
  @Expose()
  @Transform((item) => parseInt(item.value as string, 10))
  REDIS_PORT: number;

  @IsString()
  @Expose()
  FIREBASE_WEB_API_KEY: string;

  @IsString()
  @Expose()
  FIREBASE_PROJECT_ID: string;

  @IsString()
  @Expose()
  FIREBASE_CLIENT_EMAIL: string;

  @IsString()
  @Expose()
  FIREBASE_PRIVATE_KEY: string;

  @IsString()
  @Expose()
  SMTP_FROM: string;

  @IsString()
  @Expose()
  SMTP_HOST: string;

  @IsNumber()
  @Expose()
  @Transform((item) => parseInt(item.value as string, 10))
  SMTP_PORT: number;

  @IsString()
  @Expose()
  SMTP_USER: string;

  @IsString()
  @Expose()
  SMTP_PASS: string;

  @IsString()
  @Expose()
  AUTO_SETUP_MULTITENANCY: string;

  @IsOptional()
  @IsString()
  @Expose()
  GOOGLE_CLIENT_ID: string;

  @IsOptional()
  @IsString()
  @Expose()
  GOOGLE_CLIENT_SECRET: string;

  @IsOptional()
  @IsString()
  @Expose()
  GOOGLE_CALLBACK_URL: string;
}

export const validateEnvVariables = (config: EnvironmentVariables) => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
};
