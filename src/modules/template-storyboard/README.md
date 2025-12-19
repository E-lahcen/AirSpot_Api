# Template Storyboard Module

## Overview

The Template Storyboard module provides functionality for managing reusable storyboard templates. These templates are similar to regular storyboards but are designed to be used as starting points for creating new storyboards.

## Features

- **Create Template Storyboards**: Only Super Admins can create new template storyboards
- **List Template Storyboards**: All authenticated users can view and list available templates
- **Get Template Details**: All authenticated users can view individual template details
- **Update Templates**: Only Super Admins can update existing templates
- **Delete Templates**: Only Super Admins can delete templates

## Access Control

### Super Admin Only Operations
- `POST /template-storyboards` - Create a new template
- `PATCH /template-storyboards/:id` - Update an existing template
- `DELETE /template-storyboards/:id` - Delete a template

### All Authenticated Users
- `GET /template-storyboards` - List all templates (with pagination and filtering)
- `GET /template-storyboards/:id` - Get a specific template by ID

## API Endpoints

### Create Template Storyboard
```http
POST /template-storyboards
Authorization: Bearer <token>
Requires: super_admin role

Body:
{
  "title": "Product Launch Template",
  "duration": "30s",
  "scenes": "[{\"id\":1,\"name\":\"Opening\"}]",
  "scenesData": [...],
  "videoUrl": "https://example.com/video.mp4",
  "description": "A template for product launch campaigns",
  "imageHistory": []
}
```

### List Template Storyboards
```http
GET /template-storyboards?page=1&limit=10&title=product
Authorization: Bearer <token>

Response:
{
  "items": [...],
  "meta": {
    "totalItems": 25,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

### Get Template by ID
```http
GET /template-storyboards/:id
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "title": "Product Launch Template",
  "duration": "30s",
  ...
}
```

### Update Template
```http
PATCH /template-storyboards/:id
Authorization: Bearer <token>
Requires: super_admin role

Body:
{
  "title": "Updated Template Title",
  "description": "Updated description"
}
```

### Delete Template
```http
DELETE /template-storyboards/:id
Authorization: Bearer <token>
Requires: super_admin role
```

## Entity Structure

### TemplateStoryboard Entity

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | UUID | Unique identifier | Yes (auto-generated) |
| title | String (255) | Template title | Yes |
| duration | String (50) | Duration (e.g., "30s") | Yes |
| scenes | Text | JSON string of scenes | Yes |
| scenes_data | JSONB | Detailed scene data | Yes |
| video_url | String (500) | Video URL | Yes |
| imageHistory | String[] | Array of image URLs | No |
| description | Text | Template description | No |
| created_at | Timestamp | Creation date | Auto |
| updated_at | Timestamp | Last update date | Auto |
| deleted_at | Timestamp | Soft delete date | Auto |

## Integration

The module is integrated into the application in `app.module.ts`:

```typescript
import { TemplateStoryboardModule } from './modules/template-storyboard/template-storyboard.module';

@Module({
  imports: [
    // ... other modules
    TemplateStoryboardModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Database Migration

A migration file has been created at:
```
src/migrations/1734635000000-AddTemplateStoryboards.ts
```

To run the migration:
```bash
npm run migration:run
```

## Differences from Regular Storyboards

1. **No Organization/Tenant Association**: Template storyboards are global and not tied to specific organizations
2. **No Owner**: Templates don't have an owner since they're system-wide resources
3. **Access Control**: Create, update, and delete operations are restricted to super admins only
4. **Additional Description Field**: Templates have a description field to explain their purpose

## Future Enhancements

- Template categories for better organization
- Template usage analytics
- Template cloning functionality to create regular storyboards from templates
- Template versioning
- Preview thumbnails for templates
