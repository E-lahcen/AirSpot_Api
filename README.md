# Airspot API

A multi-tenant advertising campaign management platform built with NestJS, providing comprehensive APIs for managing campaigns, creatives, ad variations, and audiences with Firebase authentication.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [Multi-Tenancy](#-multi-tenancy)
- [Additional Documentation](#-additional-documentation)
- [Contributing](#-contributing)

## 🎯 Overview

Airspot API is a **schema-based multi-tenant** advertising campaign management system that enables organizations to create and manage their advertising operations in isolated tenant environments. Each tenant has its own database schema ensuring complete data isolation while sharing the same application infrastructure.

## ✨ Features

- 🏢 **Multi-Tenancy**: Schema-based isolation with PostgreSQL
- 🔐 **Firebase Authentication**: Multi-tenant authentication with custom tokens
- 📊 **Campaign Management**: Create and manage advertising campaigns
- 🎨 **Creative Management**: Handle creative assets and variations
- 🎯 **Audience Targeting**: Manage audience segments and targeting
- 📄 **API Documentation**: Interactive Swagger/OpenAPI documentation
- 🔄 **Automated Migrations**: TypeORM migrations with tenant schema support
- ✅ **Validation**: Request validation with class-validator
- 🐳 **Docker Support**: Containerized development environment
- 📦 **Pagination**: Built-in pagination support for all list endpoints

## 🛠 Technology Stack

### Core

- **NestJS v11.0.1** - Progressive Node.js framework
- **TypeScript v5.7.3** - Type-safe development
- **Node.js** - Runtime environment

### Database & ORM

- **PostgreSQL 17** - Primary database
- **TypeORM v0.3.27** - Object-Relational Mapping
- **Redis** - Caching and session management

### Authentication

- **Firebase Admin SDK v13.6.0** - Multi-tenant authentication

### Documentation

- **Swagger/OpenAPI** - API documentation via @nestjs/swagger

### Development Tools

- **Docker & Docker Compose** - Containerization
- **ESLint & Prettier** - Code quality and formatting
- **Husky** - Git hooks for pre-commit checks
- **Commitlint** - Conventional commit enforcement
- **Jest** - Testing framework

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **Docker** and **Docker Compose**
- **Git**
- **Firebase Project** with Admin SDK credentials

## 🚀 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Nebur242/airspot-api.git
cd airspot-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration (see [Environment Configuration](#-environment-configuration) below)

### 4. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Navigate to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Copy the credentials to your `.env` file

### 5. Start the Application

```bash
npm run start:local
```

This command will:

- Start PostgreSQL database
- Start Redis
- Start pgAdmin (database management UI)
- Build and run the API with hot-reload

The API will be available at `http://localhost:3000`

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_TYPE=postgres
DB_HOST=postgres  # Use 'localhost' for non-Docker setup
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=airspot

# Redis Configuration
REDIS_HOST=redis  # Use 'localhost' for non-Docker setup
REDIS_PORT=6379

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_WEB_API_KEY=your-firebase-web-api-key

# SMTP Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@airspot.com

# Multi-Tenancy Configuration
AUTO_SETUP_MULTITENANCY=true

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@postgres.com
PGADMIN_DEFAULT_PASSWORD=admin
```

## 🗄 Database Setup

### Running Migrations

#### Public Schema Migrations (Shared Tables)

```bash
# Generate a new migration
npm run migration:generate <migration-name>

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

#### Tenant Schema Migrations

```bash
# Run migrations for all tenant schemas
npm run tenant:migrate

# Sync tenant migrations (after creating public schema migration)
npm run tenant:sync

# Rebuild all tenant schemas (destructive!)
npm run tenant:rebuild
```

### Accessing pgAdmin

When running locally with Docker, pgAdmin is available at:

- **URL**: `http://localhost:5050`
- **Email**: Value from `PGADMIN_DEFAULT_EMAIL`
- **Password**: Value from `PGADMIN_DEFAULT_PASSWORD`

To connect to PostgreSQL in pgAdmin:

- **Host**: `postgres` (Docker network name)
- **Port**: `5432`
- **Username**: Value from `DB_USERNAME`
- **Password**: Value from `DB_PASSWORD`

## 🏃 Running the Application

### Development with Docker (Recommended)

```bash
# Start all services with hot-reload
npm run start:local
```

### Development without Docker

```bash
# Make sure PostgreSQL and Redis are running locally

# Watch mode
npm run start:dev

# Debug mode
npm run start:debug
```

### Production

```bash
# Build the application
npm run build

# Run in production mode
npm run start:prod
```

## 📚 API Documentation

Interactive API documentation is available via Swagger UI:

**URL**: `http://localhost:3000/api/docs`

The documentation includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Try-it-out functionality

### Key Endpoints

| Endpoint                | Method | Description                        |
| ----------------------- | ------ | ---------------------------------- |
| `/api/v1/auth/register` | POST   | Register new organization and user |
| `/api/v1/auth/login`    | POST   | User login                         |
| `/api/v1/campaigns`     | GET    | List campaigns with pagination     |
| `/api/v1/campaigns`     | POST   | Create new campaign                |
| `/api/v1/creatives`     | GET    | List creatives                     |
| `/api/v1/ad-variations` | GET    | List ad variations                 |
| `/api/v1/audiences`     | GET    | List audiences                     |

All list endpoints support pagination with `page` and `limit` query parameters.

## 📁 Project Structure

```
airspot-api/
├── src/
│   ├── common/              # Shared utilities, DTOs, entities
│   │   ├── dtos/           # Common DTOs (e.g., PaginationDto)
│   │   ├── entities/       # Base entities
│   │   └── enums/          # Shared enums
│   ├── config/             # Configuration files
│   │   └── data-source.ts  # TypeORM configuration
│   ├── core/               # Core infrastructure
│   │   ├── decorators/     # Custom decorators
│   │   ├── exceptions/     # Custom exceptions
│   │   ├── filters/        # Exception filters
│   │   ├── interceptors/   # Request/response interceptors
│   │   └── validators/     # Custom validators
│   ├── migrations/         # Public schema migrations
│   ├── modules/            # Feature modules
│   │   ├── auth/          # Authentication module
│   │   ├── campaign/      # Campaign management
│   │   ├── creative/      # Creative management
│   │   ├── ad-variation/  # Ad variation management
│   │   ├── audience/      # Audience management
│   │   ├── tenant/        # Multi-tenancy support
│   │   └── user/          # User management
│   ├── scripts/           # Utility scripts
│   │   ├── run-tenant-migrations.ts
│   │   ├── sync-tenant-migrations.ts
│   │   └── rebuild-tenant-schemas.ts
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── docker/                # Docker configurations
│   ├── Dockerfile.local   # Local development
│   └── Dockerfile.prod    # Production build
├── test/                  # E2E tests
├── postman/              # Postman collection
├── migrations/           # SQL migration scripts
├── docker-compose.local.yml
├── .env.example
├── package.json
├── tsconfig.json
├── ARCHITECTURE.md       # Detailed architecture documentation
├── AUTHENTICATION_GUIDE.md
└── README.md
```

## 📜 Available Scripts

### Development

```bash
# Start with Docker (recommended)
npm run start:local

# Development with watch mode (requires local DB)
npm run start:dev

# Debug mode
npm run start:debug
```

### Build & Production

```bash
# Build for production
npm run build

# Run production build
npm run start:prod
```

### Database Migrations

```bash
# Generate new public schema migration
npm run migration:generate <migration-name>

# Create empty migration file
npm run migration:create <migration-name>

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Tenant-specific migrations
npm run tenant:migrate     # Run migrations for all tenants
npm run tenant:sync        # Sync tenant migrations
npm run tenant:rebuild     # Rebuild all tenant schemas (destructive)
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Debug tests
npm run test:debug
```

## 🧪 Testing

The project uses Jest as the testing framework.

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode (useful during development)
npm run test:watch

# Test coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### Test Structure

```
test/
├── app.e2e-spec.ts      # End-to-end tests
└── jest-e2e.json        # E2E Jest configuration

src/
└── **/*.spec.ts         # Unit tests alongside source files
```

## 🏢 Multi-Tenancy

Airspot uses **schema-based multi-tenancy** where each tenant gets its own PostgreSQL schema.

### How It Works

1. **Public Schema**: Contains shared tables
   - `tenants` - Tenant configurations
   - `users` - User accounts
   - `invitations` - User invitations

2. **Tenant Schemas**: Each tenant gets a dedicated schema (e.g., `tenant_acme`)
   - `campaigns` - Campaign data
   - `creatives` - Creative assets
   - `ad_variations` - Ad variations
   - `audiences` - Audience targeting

### Tenant Operations

```bash
# Automatically set up multi-tenancy on first run
AUTO_SETUP_MULTITENANCY=true

# Manually run tenant migrations
npm run tenant:migrate

# Sync tenant migration files
npm run tenant:sync

# Rebuild all tenant schemas (WARNING: destructive)
npm run tenant:rebuild
```

### Creating a New Tenant

Tenants are automatically created during user registration:

```bash
POST /api/v1/auth/register
{
  "email": "admin@company.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "organizationName": "Acme Corp"
}
```

This creates:

- Firebase tenant
- Database tenant record
- Tenant schema with all tables
- Admin user account

## 📖 Additional Documentation

For more detailed information, refer to:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture and design patterns
- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** - Frontend integration guide for authentication
- **[ENTITY_RELATIONSHIPS.md](./ENTITY_RELATIONSHIPS.md)** - Database schema and relationships
- **[src/scripts/TENANT_MIGRATION_SYNC.md](./src/scripts/TENANT_MIGRATION_SYNC.md)** - Tenant migration synchronization guide

## 🔐 Authentication

The API uses Firebase Authentication with custom tokens for multi-tenancy support.

### Making Authenticated Requests

Include the access token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:3000/api/v1/campaigns
```

### Example: Register and Login

**Register**:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe",
    "organizationName": "My Company"
  }'
```

**Login**:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "tenantSlug": "my-company"
  }'
```

## 🐛 Troubleshooting

### Common Issues

**1. PostgreSQL Connection Failed**

```bash
# Make sure PostgreSQL is running
docker compose -f docker-compose.local.yml ps

# Check logs
docker compose -f docker-compose.local.yml logs postgres
```

**2. Migration Errors**

```bash
# Check migration status
npm run migration:show

# Revert last migration if needed
npm run migration:revert

# Re-run migrations
npm run migration:run
```

**3. Firebase Authentication Errors**

- Verify Firebase credentials in `.env`
- Ensure Firebase project has Authentication enabled
- Check that private key is properly formatted (include `\n` for line breaks)

**4. Port Already in Use**

```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Git Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Commit using conventional commits: `git commit -m "feat: add new feature"`
5. Push to your fork: `git push origin feature/my-feature`
6. Create a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: code style changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

Examples:

```bash
git commit -m "feat(campaign): add campaign filtering"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "docs(readme): update setup instructions"
```

### Code Quality

- Run linting before committing: `npm run lint`
- Format code: `npm run format`
- Write tests for new features
- Update documentation as needed

Pre-commit hooks will automatically:

- Lint and format staged files
- Validate commit messages
- Check tenant migration sync

## 📝 License

This project is [UNLICENSED](LICENSE).

## 👥 Authors

- **Nebur242** - [GitHub](https://github.com/Nebur242)

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Authentication powered by [Firebase](https://firebase.google.com/)
- Database by [PostgreSQL](https://www.postgresql.org/)
- ORM by [TypeORM](https://typeorm.io/)

---

## 📞 Support

For questions and support:

- 📧 Email: support@airspot.com
- 📚 Documentation: Check the `/docs` folder
- 🐛 Issues: [GitHub Issues](https://github.com/Nebur242/airspot-api/issues)

---

**Happy Coding! 🚀**

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
