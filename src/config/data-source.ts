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

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/entities/*.entity.js', 'src/**/entities/*.entity.ts'],
  migrations: ['dist/migrations/[0-9]*-*.js', 'src/migrations/[0-9]*-*.ts'],
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
