# Task Management System

## Overview

This document describes the Task Management system implemented for the AirSpot API. The system allows users to create, manage, and track tasks related to campaigns and creatives. It also includes task templates for automating task creation based on predefined workflows.

## Features

### 1. Task Management
- Create, read, update, and delete tasks
- Associate tasks with campaigns or creatives (optional)
- Assign tasks to users
- Set task priority (Low, Medium, High)
- Track task status (To Do, In Progress, Completed)
- Set due dates for tasks
- Filter and search tasks
- Get task statistics (total, by status, overdue)

### 2. Task Templates
- Create reusable task templates
- Define templates for Campaign or Creative workflows
- Specify multiple tasks with priorities and relative due dates
- Apply templates to automatically create tasks
- Calculate due dates based on a base date

## Database Schema

### Tasks Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Tenant organization ID |
| name | VARCHAR(255) | Task name |
| description | TEXT | Task description |
| related_campaign_id | UUID | Optional campaign reference |
| related_creative_id | UUID | Optional creative reference |
| assigned_user_id | UUID | User assigned to task |
| status | ENUM | To Do, In Progress, Completed |
| priority | ENUM | Low, Medium, High |
| due_date | DATE | Task due date |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

### Task Templates Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Tenant organization ID |
| name | VARCHAR(255) | Template name |
| task_type | ENUM | Campaign or Creative |
| tasks | JSONB | Array of task items |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

### Relationships
- **Task → Campaign**: Many-to-One (optional, ON DELETE SET NULL)
- **Task → Creative**: Many-to-One (optional, ON DELETE SET NULL)
- **Task → User**: Many-to-One (required, ON DELETE CASCADE)
- **Campaign → Tasks**: One-to-Many
- **Creative → Tasks**: One-to-Many

## API Endpoints

### Tasks

#### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Review campaign assets",
  "description": "Review all creative assets for the new campaign",
  "related_campaign_id": "123e4567-e89b-12d3-a456-426614174000",
  "assigned_user_id": "123e4567-e89b-12d3-a456-426614174002",
  "status": "To Do",
  "priority": "High",
  "due_date": "2025-12-31"
}
```

#### Get All Tasks
```http
GET /tasks?page=1&limit=10&search=review&status=To Do&priority=High&campaign_id=xxx&assigned_user_id=xxx
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by task name
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `campaign_id` (optional): Filter by campaign
- `creative_id` (optional): Filter by creative
- `assigned_user_id` (optional): Filter by assigned user

#### Get Task Statistics
```http
GET /tasks/statistics
Authorization: Bearer <token>

Response:
{
  "total": 50,
  "todo": 20,
  "inProgress": 15,
  "completed": 15,
  "overdue": 5
}
```

#### Get Single Task
```http
GET /tasks/:id
Authorization: Bearer <token>
```

#### Update Task
```http
PATCH /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "In Progress",
  "priority": "Medium"
}
```

#### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

### Task Templates

#### Create Task Template
```http
POST /task-templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Standard Campaign Launch",
  "task_type": "Campaign",
  "tasks": [
    {
      "name": "Review creative brief",
      "description": "Review and approve the creative brief document",
      "priority": "High",
      "daysUntilDue": 3
    },
    {
      "name": "Approve assets",
      "description": "Final approval of all campaign assets",
      "priority": "High",
      "daysUntilDue": 7
    },
    {
      "name": "Launch campaign",
      "description": "Launch the campaign on selected platforms",
      "priority": "Medium",
      "daysUntilDue": 10
    }
  ]
}
```

#### Get All Task Templates
```http
GET /task-templates?page=1&limit=10&search=campaign&task_type=Campaign
Authorization: Bearer <token>
```

#### Get Single Task Template
```http
GET /task-templates/:id
Authorization: Bearer <token>
```

#### Update Task Template
```http
PATCH /task-templates/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Campaign Launch",
  "tasks": [...]
}
```

#### Delete Task Template
```http
DELETE /task-templates/:id
Authorization: Bearer <token>
```

#### Apply Template
```http
POST /task-templates/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "template_id": "123e4567-e89b-12d3-a456-426614174000",
  "related_campaign_id": "123e4567-e89b-12d3-a456-426614174001",
  "assigned_user_id": "123e4567-e89b-12d3-a456-426614174003",
  "base_date": "2025-12-15"
}
```

**Response:** Array of created tasks with calculated due dates

## Entities and DTOs

### Task Entity Enums
```typescript
export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}
```

### Task Template Enums
```typescript
export enum TaskType {
  CAMPAIGN = 'Campaign',
  CREATIVE = 'Creative',
}
```

### Task Template Item Structure
```typescript
interface TaskTemplateItem {
  name: string;
  description: string;
  priority: Priority;
  daysUntilDue: number;
}
```

## Migration

The task management tables are created in tenant schemas via the tenant migration system.

**Migration file:** `src/migrations/tenant-schema-migrations.ts`
**Version:** `1733999000000`
**Name:** `AddTasksAndTaskTemplates`

### Running Migrations

To apply the task management migration to existing tenant schemas:

```bash
# For development
npm run migration:run

# For production
npm run migrate:production
```

## Usage Examples

### Creating a Task Manually
```typescript
// POST /tasks
{
  "name": "Review Q4 Campaign Performance",
  "description": "Analyze metrics and prepare report",
  "related_campaign_id": "campaign-uuid",
  "assigned_user_id": "user-uuid",
  "status": "To Do",
  "priority": "High",
  "due_date": "2025-12-20"
}
```

### Creating Tasks from Template
```typescript
// 1. Create a template
POST /task-templates
{
  "name": "Creative Production Workflow",
  "task_type": "Creative",
  "tasks": [
    {
      "name": "Initial concept review",
      "description": "Review initial creative concepts",
      "priority": "High",
      "daysUntilDue": 2
    },
    {
      "name": "Asset creation",
      "description": "Create all required assets",
      "priority": "Medium",
      "daysUntilDue": 5
    },
    {
      "name": "Final approval",
      "description": "Get final sign-off from stakeholders",
      "priority": "High",
      "daysUntilDue": 7
    }
  ]
}

// 2. Apply the template
POST /task-templates/apply
{
  "template_id": "template-uuid",
  "related_creative_id": "creative-uuid",
  "assigned_user_id": "user-uuid",
  "base_date": "2025-12-15"
}

// This creates 3 tasks:
// - Task 1: Due 2025-12-17 (2 days from base date)
// - Task 2: Due 2025-12-20 (5 days from base date)
// - Task 3: Due 2025-12-22 (7 days from base date)
```

### Getting Task Statistics
```typescript
// GET /tasks/statistics
Response:
{
  "total": 45,
  "todo": 20,        // Tasks in "To Do" status
  "inProgress": 12,  // Tasks in "In Progress" status
  "completed": 13,   // Tasks in "Completed" status
  "overdue": 8       // Tasks past due date and not completed
}
```

### Filtering Tasks
```typescript
// Get all high-priority tasks for a specific campaign
GET /tasks?campaign_id=xxx&priority=High&status=To Do

// Get overdue tasks assigned to current user
GET /tasks?assigned_user_id=xxx&status=To Do

// Search tasks by name
GET /tasks?search=review
```

## Frontend Integration

### Task List Component
- Display tasks in a table or kanban board
- Filter by status, priority, campaign, or user
- Sort by due date, priority, or creation date
- Show overdue indicator
- Quick status update

### Task Details Component
- View full task details
- Edit task properties
- View related campaign/creative
- Add comments (future enhancement)
- Track history (future enhancement)

### Task Template Manager
- List available templates
- Create/edit templates
- Preview template tasks
- Apply template with date picker

## Security

- All endpoints require authentication (Bearer token)
- Tasks are scoped to tenant organization
- Users can only access tasks within their organization
- Foreign key constraints ensure data integrity

## Performance Considerations

- Indexes on frequently queried fields:
  - `organization_id`
  - `assigned_user_id`
  - `related_campaign_id`
  - `related_creative_id`
  - `status`
  - `due_date`

- Pagination on list endpoints to limit data transfer
- Soft deletes allow data recovery
- JSONB for flexible template storage

## Future Enhancements

1. **Task Comments**: Add commenting system
2. **Task History**: Track all task changes
3. **Notifications**: Remind users of upcoming/overdue tasks
4. **Subtasks**: Break down tasks into smaller items
5. **Task Dependencies**: Define task order dependencies
6. **Recurring Tasks**: Automatically create periodic tasks
7. **Custom Fields**: Allow custom task properties
8. **Task Labels/Tags**: Categorize tasks
9. **Time Tracking**: Log time spent on tasks
10. **File Attachments**: Attach files to tasks

## Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Cases
- Create task with valid data
- Create task with invalid data
- Update task status
- Delete task
- Apply template
- Filter tasks by various criteria
- Get task statistics
- Handle non-existent tasks
- Handle unauthorized access

## Troubleshooting

### Migration Issues
If the migration fails:
```bash
# Check migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# Re-run migrations
npm run migration:run
```

### Common Errors
- **Task not found**: Check if task exists and user has access
- **Invalid status**: Ensure status is one of: "To Do", "In Progress", "Completed"
- **Invalid priority**: Ensure priority is one of: "Low", "Medium", "High"
- **Invalid date format**: Use ISO 8601 format (YYYY-MM-DD)

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint documentation (Swagger/OpenAPI)
3. Check application logs
4. Contact the development team
