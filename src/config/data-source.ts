import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables - prefer .env.migration if it exists (for local migrations)
const migrationEnvPath = resolve(process.cwd(), '.env.migration');
const defaultEnvPath = resolve(process.cwd(), '.env');

if (existsSync(migrationEnvPath)) {
  config({ path: migrationEnvPath });
} else {
  config({ path: defaultEnvPath });
}

const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: isProduction
    ? ['dist/src/**/entities/*.entity.js']
    : ['src/**/entities/*.entity.ts'],
  migrations: isProduction
    ? ['dist/src/migrations/[0-9]*-*.js']
    : ['src/migrations/[0-9]*-*.ts'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  extra: {
    max: 20, // Maximum pool size
    connectionTimeoutMillis: 10000, // 10s timeout for acquiring connection
    idleTimeoutMillis: 30000, // 30s before idle connection is closed
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
