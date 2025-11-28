# Airspot API - System Architecture

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Multi-Tenancy System](#multi-tenancy-system)
5. [Module Structure](#module-structure)
6. [Core Infrastructure](#core-infrastructure)
7. [Database Architecture](#database-architecture)
8. [Authentication & Authorization](#authentication--authorization)
9. [API Documentation](#api-documentation)
10. [Development Workflow](#development-workflow)

---

## Overview

Airspot API is a **multi-tenant advertising campaign management platform** built with NestJS. The application enables organizations to create and manage advertising campaigns, creatives, ad variations, and audiences in isolated tenant environments.

**Key Features:**

- Schema-based multi-tenancy with PostgreSQL
- Firebase Authentication with multi-tenant support
- RESTful API with comprehensive Swagger documentation
- Automated tenant schema migrations
- Type-safe development with TypeScript

---

## Technology Stack

### Core Framework

- **NestJS v11.0.1**: Progressive Node.js framework for building scalable server-side applications
- **TypeScript v5.7.3**: Strongly typed programming language
- **Node.js**: Runtime environment

### Database & ORM

- **PostgreSQL**: Primary database (schema-based multi-tenancy)
- **TypeORM v0.3.27**: Object-Relational Mapping with migration support
- **nestjs-typeorm-paginate v4.1.0**: Pagination utilities

### Authentication

- **Firebase Admin SDK v13.6.0**: Multi-tenant authentication and user management
- **Custom JWT**: Firebase custom tokens for tenant-scoped authentication

### API Documentation

- **@nestjs/swagger v11.2.3**: OpenAPI/Swagger integration
- **Custom Decorators**: Reusable API documentation components

### Validation & Transformation

- **class-validator v0.14.2**: Decorator-based validation
- **class-transformer v0.5.1**: Object transformation and serialization

### Development Tools

- **ESLint v9.18.0**: Code linting with TypeScript support
- **Prettier v3.4.2**: Code formatting
- **Husky v9.1.7**: Git hooks
- **Commitlint v20.1.0**: Conventional commit enforcement
- **Jest v30.0.0**: Testing framework
- **Docker**: Containerization and local development

---

## Architecture Patterns

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│          Controllers (HTTP Layer)            │
│   - Route handling                           │
│   - Request validation (DTOs)                │
│   - Response transformation                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            Services (Business Logic)         │
│   - Domain logic                             │
│   - Data manipulation                        │
│   - Cross-entity operations                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Repositories (Data Access)           │
│   - TypeORM repositories                     │
│   - Database queries                         │
│   - Transaction management                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              PostgreSQL Database             │
│   - Public schema (shared data)              │
│   - Tenant schemas (isolated data)           │
└─────────────────────────────────────────────┘
```

### Module-Based Organization

Each feature is encapsulated in a dedicated NestJS module:

- Self-contained with controllers, services, entities, DTOs
- Clear boundaries and dependencies
- Reusable across the application

### Dependency Injection

- **Constructor-based injection**: Primary DI pattern
- **Global modules**: Core, Firebase, Tenant services
- **Scoped providers**: Tenant-specific database connections

---

## Multi-Tenancy System

### Schema-Based Isolation

Each tenant has a **dedicated PostgreSQL schema** for complete data isolation:

```
Database: airspot
├── public (shared schema)
│   ├── tenants (tenant registry)
│   ├── migrations (TypeORM tracking)
│   └── typeorm_metadata
├── tenant_acme_corp (Tenant 1)
│   ├── users
│   ├── campaigns
│   ├── creatives
│   ├── ad_variations
│   ├── audiences
│   ├── roles
│   └── invitations
└── tenant_widgets_inc (Tenant 2)
    ├── users
    ├── campaigns
    ├── ... (same structure)
```

### Tenant Resolution

**Flow:**

1. Client includes `x-tenant-slug` header in API requests
2. `TenantMiddleware` intercepts request
3. Validates tenant existence and status
4. Injects tenant context into request
5. `TenantConnectionService` provides schema-scoped database connection

**Middleware Configuration:**

```typescript
// Applied to all routes except:
- /auth/register (tenant creation)
- /auth/login (authentication)
- /health (monitoring)
- /api-docs (documentation)
```

### Tenant Lifecycle

**1. Registration:**

- User registers via `/auth/register`
- System creates:
  - Tenant record in public schema
  - Tenant-specific schema (e.g., `tenant_company_name`)
  - Initial database tables
  - Firebase tenant authentication
  - Owner user record

**2. Migration Management:**

- **Automatic**: Runs on application startup for all tenants
- **Manual**: `npm run tenant:migrate` command
- **Rebuild**: `npm run tenant:rebuild` (⚠️ destructive)

**3. Connection Pooling:**

- Dynamic connections per tenant schema
- Cached for performance
- Automatic cleanup on tenant deactivation

### Tenant Services

**TenantService:**

- Tenant CRUD operations
- Tenant lookup and validation

**TenantConnectionService:**

- Schema-scoped database connections
- Connection caching and management

**TenantSetupService:**

- New tenant initialization
- Schema creation and setup

**TenantMigrationService:**

- Run migrations across all tenants
- Migration status tracking

**TenantManagementService:**

- High-level tenant operations
- Orchestrates setup and lifecycle

---

## Module Structure

### Core Modules (Global)

#### **CoreModule**

- **Purpose**: Global configuration and cross-cutting concerns
- **Components**:
  - `HttpExceptionFilter`: Centralized error handling
  - `TransformInterceptor`: Response standardization
  - `LoggingInterceptor`: Request/response logging
- **Exports**: Global filters and interceptors

#### **FirebaseModule**

- **Purpose**: Firebase Admin SDK integration
- **Providers**:
  - `FIREBASE_ADMIN`: Firebase app instance
  - `FIREBASE_AUTH`: Authentication service
- **Features**:
  - Multi-tenant authentication
  - Custom token generation
  - User management

#### **TenantModule**

- **Purpose**: Multi-tenancy infrastructure (see above)
- **Exports**: All tenant services for global access

### Feature Modules

#### **AuthModule**

Path: `src/modules/auth`

**Responsibilities:**

- User registration and login
- Firebase token exchange
- Tenant-scoped authentication
- Session management

**Key Components:**

- `AuthController`: Authentication endpoints
- `AuthService`: Firebase integration
- `FirebaseAuthGuard`: Route protection
- `GetUser` decorator: Extract authenticated user

**Endpoints:**

- `POST /auth/register`: Create tenant and owner
- `POST /auth/login`: Authenticate user
- `POST /auth/exchange-token`: Firebase token verification

#### **UserModule**

Path: `src/modules/user`

**Responsibilities:**

- User management within tenant
- Profile updates
- User roles assignment

**Entities:**

- `User`: User profile with Firebase UID

#### **RoleModule**

Path: `src/modules/role`

**Responsibilities:**

- Role-based access control
- Permission management

**Entities:**

- `Role`: Role definitions with permissions

#### **InvitationModule**

Path: `src/modules/invitation`

**Responsibilities:**

- Invite users to tenant
- Invitation acceptance workflow

**Entities:**

- `Invitation`: Pending invitations

#### **CampaignModule**

Path: `src/modules/campaign`

**Responsibilities:**

- Campaign creation and management
- Budget tracking
- Campaign status lifecycle

**Key Components:**

- `CampaignController`: CRUD operations with pagination/filtering
- `CampaignService`: Business logic
- `Campaign` entity: Campaign data model
- `FilterCampaignDto`: Query filters (name, goal, status, budget_type)

**Relationships:**

- One Campaign → Many Ad Variations
- Owner User → Many Campaigns

**Endpoints:**

- `POST /campaigns`: Create campaign
- `GET /campaigns`: List with pagination/filters
- `GET /campaigns/:id`: Get single campaign
- `PATCH /campaigns/:id`: Update campaign
- `DELETE /campaigns/:id`: Delete campaign

#### **CreativeModule**

Path: `src/modules/creative`

**Responsibilities:**

- Creative asset management (images, videos)
- File upload and storage
- Creative metadata

**Key Components:**

- `CreativeController`: CRUD operations
- `CreativeService`: Asset handling
- `Creative` entity: Creative assets
- `FilterCreativeDto`: Query filters (name, mime_type)

**Relationships:**

- One Creative → Many Ad Variations
- Owner User → Many Creatives

**Endpoints:**

- `POST /creatives`: Upload creative
- `GET /creatives`: List with pagination/filters
- `GET /creatives/:id`: Get single creative
- `PATCH /creatives/:id`: Update creative
- `DELETE /creatives/:id`: Delete creative

#### **AdVariationModule**

Path: `src/modules/ad-variation`

**Responsibilities:**

- Ad variation creation (combines campaign + creative)
- Bidding strategy management
- Performance tracking

**Key Components:**

- `AdVariationController`: CRUD operations
- `AdVariationService`: Business logic
- `AdVariation` entity: Ad variations
- `FilterAdVariationDto`: Query filters (name, campaign_id, bidding_strategy)

**Relationships:**

- Many Ad Variations → One Campaign
- Many Ad Variations → One Creative
- One Ad Variation → Many Audiences
- Owner User → Many Ad Variations

**Endpoints:**

- `POST /ad-variations`: Create variation
- `GET /ad-variations`: List with pagination/filters
- `GET /ad-variations/:id`: Get single variation
- `PATCH /ad-variations/:id`: Update variation
- `DELETE /ad-variations/:id`: Delete variation

#### **AudienceModule**

Path: `src/modules/audience`

**Responsibilities:**

- Audience targeting configuration
- Demographic and interest targeting
- Custom audience segments

**Key Components:**

- `AudienceController`: CRUD operations
- `AudienceService`: Targeting logic
- `Audience` entity: Audience definitions
- `FilterAudienceDto`: Query filters (variation_id, type, target_id)

**Relationships:**

- Many Audiences → One Ad Variation
- Owner User → Many Audiences

**Endpoints:**

- `POST /audiences`: Create audience
- `GET /audiences`: List with pagination/filters
- `GET /audiences/:id`: Get single audience
- `PATCH /audiences/:id`: Update audience
- `DELETE /audiences/:id`: Delete audience

---

## Core Infrastructure

### Request/Response Pipeline

```
Client Request
      ↓
[TenantMiddleware] → Validate tenant, inject context
      ↓
[AuthGuard] → Verify Firebase token
      ↓
[Controller] → Route handler with DTO validation
      ↓
[Service] → Business logic execution
      ↓
[TransformInterceptor] → Standardize response
      ↓
[HttpExceptionFilter] → Error handling (if error)
      ↓
Client Response
```

### Response Standardization

All API responses follow a consistent structure:

**Success Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Exception Handling

**Custom Exceptions:**

- `TenantNotFoundException`: Tenant doesn't exist
- `TenantInactiveException`: Tenant is disabled
- `DuplicateTenantException`: Tenant already exists

**TypeORM Filters:**

- Automatic handling of database constraints
- Friendly error messages for unique violations
- Foreign key constraint errors

### Validation

**DTO-Based Validation:**

```typescript
export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(GoalType)
  goal: GoalType;

  @IsNumber()
  @Min(0)
  budget_amount: number;
}
```

**Automatic Validation:**

- Runs on all controller endpoints
- Returns 400 with detailed validation errors
- Powered by `class-validator`

### Pagination

**Common Pagination DTO:**

```typescript
export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

**Response Format:**

```json
{
  "items": [...],
  "meta": {
    "totalItems": 100,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 10,
    "currentPage": 1
  }
}
```

---

## Database Architecture

### Connection Management

**Public Schema Connection:**

```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    database: configService.get('DB_NAME'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    synchronize: false,
    autoLoadEntities: true,
    migrations: ['src/migrations/[0-9]*-*.ts'],
    migrationsRun: true,
  }),
});
```

**Tenant Schema Connection:**

```typescript
// Dynamic per-tenant connection
const connection = await tenantConnectionService.getTenantConnection(tenantId);
const repository = connection.getRepository(Campaign);
```

### Migration Strategy

**Two-Tier Migration System:**

1. **Public Schema Migrations** (TypeORM):
   - Location: `src/migrations/`
   - Entities: Tenant, User, Role, Invitation (reference only)
   - Commands: `npm run migration:generate`, `npm run migration:run`

2. **Tenant Schema Migrations** (Custom):
   - Location: `src/migrations/tenant-schema-migrations.ts`
   - Entities: All tenant-scoped tables
   - Commands: `npm run tenant:migrate`, `npm run tenant:rebuild`

**Workflow:**

1. Modify entity → Update both migration types
2. Run public migration first
3. Run tenant migrations across all schemas
4. Automatic execution on app startup

### Entity Design

**Base Entity:**

```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'owner_id', type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
```

**All tenant entities extend `BaseEntity`** for consistent auditing and ownership tracking.

### Indexing Strategy

- Primary keys: UUID v4
- Foreign keys: Indexed automatically
- Search fields: `name`, `email` (indexed)
- Composite indexes for common query patterns

---

## Authentication & Authorization

### Firebase Multi-Tenant Authentication

**Architecture:**

1. Each tenant has a dedicated Firebase tenant
2. Users authenticate via Firebase SDK (frontend)
3. Backend validates Firebase tokens
4. Custom tokens scope users to specific tenants

**Registration Flow:**

```
1. POST /auth/register
   → Create tenant record
   → Create tenant schema
   → Create Firebase tenant
   → Create Firebase user
   → Create user in tenant schema
   → Return custom token

2. Frontend receives token
   → signInWithCustomToken(auth, token)
   → Obtain Firebase ID token

3. Subsequent requests
   → Include ID token in Authorization header
   → Include tenant ID in X-Tenant-ID header
```

**Authentication Guard:**

```typescript
@UseGuards(FirebaseAuthGuard)
@Get('protected-route')
async getProtectedResource(@GetUser() user: User) {
  // user is automatically injected
}
```

### Authorization (Future)

Currently implements **tenant isolation only**. Future enhancements:

- Role-based access control (RBAC)
- Permission-based authorization
- Resource-level access control

---

## API Documentation

### Swagger Integration

**Automatic Documentation:**

- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Error responses

**Access:** `http://localhost:3000/api-docs`

### Custom Decorators

Each module uses **custom Swagger decorators** for cleaner controllers:

**Example:**

```typescript
// Instead of multiple @Api decorators
@Post()
@ApiOperation({ summary: 'Create campaign' })
@ApiBody({ type: CreateCampaignDto })
@ApiResponse({ status: 201, type: Campaign })
@ApiBearerAuth()
// ... many more decorators

// Use single custom decorator
@Post()
@ApiCreateCampaign()
async create(@Body() dto: CreateCampaignDto) {
  return this.service.create(dto);
}
```

**Location:** `src/modules/{module}/docs/`

**Decorators per module:**

- `ApiCreate{Entity}`: POST endpoint
- `ApiGet{Entities}`: GET list endpoint
- `ApiGet{Entity}`: GET single endpoint
- `ApiUpdate{Entity}`: PATCH endpoint
- `ApiDelete{Entity}`: DELETE endpoint

---

## Development Workflow

### Local Development

**Setup:**

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start local development with Docker
npm run start:local

# Or start in watch mode (no Docker)
npm run start:dev
```

**Docker Compose:**

- PostgreSQL database
- API server with hot reload
- Volume mounting for live code updates

### Code Quality

**Pre-commit Hooks:**

```bash
# Husky runs automatically on git commit
- ESLint: Code linting
- Prettier: Code formatting
- Commitlint: Conventional commit messages
- Tenant Migration Sync: Ensures migrations are synced (only for migration files)
```

**Migration Safety:**
When you commit TypeORM migration files, the system automatically checks if they've been synced to `tenant-schema-migrations.ts`. If not synced, the commit will be blocked with instructions on how to sync.

**Commit Convention:**

```
feat(module): add new feature
fix(module): fix bug
docs: update documentation
chore: maintenance tasks
```

### Testing

**Unit Tests:**

```bash
npm run test
npm run test:watch
npm run test:cov
```

**E2E Tests:**

```bash
npm run test:e2e
```

### Database Management

**Public Schema:**

```bash
# Generate migration after entity changes
npm run migration:generate add-feature-name

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

**Tenant Schemas:**

```bash
# Check if tenant migrations are synced (automatically runs on git commit)
npm run tenant:sync

# Run migrations for all tenants
npm run tenant:migrate

# Rebuild all tenant schemas (⚠️ DESTRUCTIVE)
npm run tenant:rebuild
```

**Migration Workflow:**

1. Generate migration: `npm run migration:generate name`
2. Check sync status: `npm run tenant:sync` (or commit will auto-check)
3. Add generated code to `tenant-schema-migrations.ts`
4. Run public migrations: `npm run migration:run`
5. Run tenant migrations: `npm run tenant:migrate`

See [Tenant Migration Sync Guide](./src/scripts/TENANT_MIGRATION_SYNC.md) for details.

### Debugging

**VS Code Debug Configuration:**

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229
}
```

**Start with debugging:**

```bash
npm run start:debug
```

### Build & Deploy

**Production Build:**

```bash
npm run build
```

**Start Production:**

```bash
npm run start:prod
```

**Docker Production:**

```dockerfile
# Uses Dockerfile.prod
docker build -f docker/Dockerfile.prod -t airspot-api .
docker run -p 3000:3000 airspot-api
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=airspot
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Application
NODE_ENV=development
PORT=3000
```

### Configuration Validation

All environment variables are validated on startup using `class-validator`:

```typescript
export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  // ... other validations
}
```

Application **fails fast** if configuration is invalid.

---

## Security Considerations

### Data Isolation

- **Schema-level separation**: Complete data isolation per tenant
- **No cross-tenant queries**: Middleware enforces tenant context
- **Connection scoping**: Each request uses tenant-specific connection

### Authentication Security

- **Firebase tokens**: Industry-standard JWT validation
- **Token expiration**: Automatic token refresh handling
- **Tenant binding**: Tokens scoped to specific tenants

### Input Validation

- **DTO validation**: All inputs validated before processing
- **SQL injection**: Protected by TypeORM parameterized queries
- **XSS protection**: Automatic sanitization via NestJS

### Error Handling

- **No sensitive data in errors**: Production mode hides stack traces
- **Audit logging**: All requests logged for security review
- **Rate limiting**: (Future) Protect against abuse

---

## Performance Considerations

### Database

- **Connection pooling**: Reuse connections across requests
- **Query optimization**: Indexes on common query patterns
- **Pagination**: Limit result set sizes
- **Caching**: TypeORM query cache enabled

### Application

- **Lazy loading**: Modules loaded on demand
- **Async operations**: Non-blocking I/O throughout
- **Response transformation**: Efficient serialization

### Scalability

- **Horizontal scaling**: Stateless architecture supports multiple instances
- **Schema isolation**: No cross-tenant locking
- **Database sharding**: (Future) Distribute tenant schemas across databases

---

## Future Enhancements

### Planned Features

- [ ] Role-based access control (RBAC)
- [ ] Audit logging system
- [ ] Rate limiting
- [ ] WebSocket support for real-time updates
- [ ] File upload service (S3 integration)
- [ ] Analytics and reporting
- [ ] Background job processing (Bull/Redis)
- [ ] Tenant usage metrics
- [ ] Multi-region support

### Technical Debt

- [ ] Increase test coverage (currently minimal)
- [ ] Add integration tests for multi-tenancy
- [ ] Performance benchmarking
- [ ] Database query optimization
- [ ] API versioning strategy

---

## Related Documentation

- [Entity Relationships](./ENTITY_RELATIONSHIPS.md)
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Multi-Tenant Migrations](./MULTI_TENANT_MIGRATIONS.md)
- [Migration Sync Guide](./MIGRATION_SYNC_GUIDE.md)
- [How to Sync Migrations](./HOW_TO_SYNC_MIGRATIONS.md)

---

## Support & Contribution

For questions or issues:

1. Check existing documentation
2. Review entity relationships diagram
3. Examine module-specific README files
4. Consult authentication guide for Firebase integration

**Development Best Practices:**

- Follow existing module structure
- Update migrations for schema changes
- Add Swagger documentation for new endpoints
- Write tests for new features
- Update this architecture document for significant changes
