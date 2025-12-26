# Organization KPI Endpoints Documentation

## Overview

The Organization KPI endpoints provide comprehensive analytics and metrics about campaigns, creatives, audiences, and ad variations for each organization. These endpoints allow users to fetch detailed KPI data for their organizations, enabling better decision-making and performance monitoring.

## Key Features

- **Multi-Organization Support**: Users can access KPI data for all organizations they belong to (owned or as members)
- **Detailed Metrics**: Get comprehensive KPI data including campaign statistics, creative usage, audience insights, and bidding strategies
- **Summary Views**: Quick overview of key metrics without detailed breakdowns
- **Aggregated Statistics**: View combined statistics across multiple organizations

## Authentication

All KPI endpoints require authentication using the `AuthGuard` and support the following roles:
- `owner`
- `admin`
- `super_admin`
- `member`

## Endpoints

### 1. Get Comprehensive KPI for a Specific Organization

**Endpoint**: `GET /organisations/:id/kpi`

**Description**: Retrieve detailed KPI metrics for campaigns, creatives, audiences, and ad variations for a specific organization.

**Parameters**:
- `id` (UUID): Organization ID

**Response**: `OrganisationKpiDto`

**Example Response**:
```json
{
  "organization_id": "org-uuid-123",
  "organization_name": "Acme Corp",
  "campaigns": {
    "total_campaigns": 15,
    "active_campaigns": 5,
    "draft_campaigns": 3,
    "paused_campaigns": 2,
    "completed_campaigns": 5,
    "total_budget": 50000,
    "average_budget": 3333.33,
    "total_spent": 25000,
    "status_distribution": {
      "ACTIVE": 5,
      "DRAFT": 3,
      "PAUSED": 2,
      "COMPLETED": 5,
      "PENDING_VERIFICATION": 0,
      "VERIFIED": 0,
      "REJECTED": 0
    },
    "goal_distribution": {
      "AWARENESS": 3,
      "CONVERSIONS": 5,
      "TRAFFIC": 2,
      "RETARGET": 1,
      "APP_REVENUE": 1,
      "LEADS": 1,
      "SALES": 2
    }
  },
  "creatives": {
    "total_creatives": 45,
    "video_creatives": 25,
    "image_creatives": 20,
    "creatives_by_brand": {
      "Brand A": 15,
      "Brand B": 20,
      "Unbranded": 10
    },
    "avg_creatives_per_campaign": 3.0,
    "top_creatives": [
      {
        "id": "creative-1",
        "name": "Summer Promo Video",
        "usage_count": 12
      },
      {
        "id": "creative-2",
        "name": "Winter Sale Banner",
        "usage_count": 8
      }
    ]
  },
  "audiences": {
    "total_audiences": 120,
    "audience_by_type": {
      "DEMOGRAPHIC": 45,
      "INTEREST": 35,
      "GEOGRAPHY": 25,
      "BEHAVIOR": 10,
      "CHANNEL": 3,
      "DELIVERY_TIME": 2
    },
    "avg_audiences_per_variation": 2.5,
    "top_audiences": [
      {
        "id": "audience-1",
        "name": "Age 25-34",
        "type": "DEMOGRAPHIC",
        "usage_count": 8,
        "total_size": "5000000"
      }
    ],
    "total_audience_reach": "15000000"
  },
  "ad_variations": {
    "total_variations": 35,
    "active_variations": 12,
    "avg_variations_per_campaign": 2.33,
    "bidding_strategy_distribution": {
      "AUTOMATIC": 20,
      "MANUAL_CPM": 15
    },
    "average_cpm": 5.5
  },
  "calculated_at": "2025-12-26T10:00:00Z"
}
```

---

### 2. Get KPI Summary for a Specific Organization

**Endpoint**: `GET /organisations/:id/kpi/summary`

**Description**: Retrieve a summary of key KPI metrics (campaign, creative, audience counts and budgets).

**Parameters**:
- `id` (UUID): Organization ID

**Response**: `OrganisationKpiSummaryDto`

**Example Response**:
```json
{
  "organization_id": "org-uuid-123",
  "organization_name": "Acme Corp",
  "total_campaigns": 15,
  "active_campaigns": 5,
  "total_creatives": 45,
  "total_audiences": 120,
  "total_budget": 50000,
  "total_spent": 25000,
  "user_role": "owner"
}
```

---

### 3. Get KPI for All User Organizations

**Endpoint**: `GET /organisations/kpi/my-organisations/all`

**Description**: Retrieve KPI summaries for all organizations that the current user belongs to (owned or as member).

**Authentication**: Uses the current authenticated user from the request context.

**Response**: `MultipleOrganisationsKpiDto`

**Example Response**:
```json
{
  "organizations": [
    {
      "organization_id": "org-1",
      "organization_name": "Acme Corp",
      "total_campaigns": 15,
      "active_campaigns": 5,
      "total_creatives": 45,
      "total_audiences": 120,
      "total_budget": 50000,
      "total_spent": 25000,
      "user_role": "owner"
    },
    {
      "organization_id": "org-2",
      "organization_name": "Beta Inc",
      "total_campaigns": 8,
      "active_campaigns": 3,
      "total_creatives": 22,
      "total_audiences": 60,
      "total_budget": 30000,
      "total_spent": 15000,
      "user_role": "admin"
    }
  ],
  "total_organizations": 2,
  "combined_stats": {
    "total_campaigns": 23,
    "total_creatives": 67,
    "total_audiences": 180,
    "total_budget": 80000
  }
}
```

---

### 4. Get KPI Summaries for Specific Organizations

**Endpoint**: `GET /organisations/kpi/organisations/summary`

**Description**: Retrieve KPI summaries for multiple specific organizations. Pass comma-separated organization IDs as query parameter.

**Query Parameters**:
- `ids` (string, required): Comma-separated list of organization IDs (e.g., `id1,id2,id3`)

**Example Request**:
```
GET /organisations/kpi/organisations/summary?ids=org-1,org-2,org-3
```

**Response**: `MultipleOrganisationsKpiDto`

---

## Data Models

### CampaignKpiDto
Detailed campaign metrics including:
- Total campaigns by status
- Budget information (total, average, spent)
- Distribution by status and goal type

### CreativeKpiDto
Creative asset metrics including:
- Count by type (video/image)
- Count by brand
- Top creatives by usage
- Average creatives per campaign

### AudienceKpiDto
Audience targeting metrics including:
- Total audience count
- Distribution by type (demographic, interest, geography, etc.)
- Top audiences by usage
- Total audience reach

### AdVariationKpiDto
Ad variation metrics including:
- Total variations
- Active variations count
- Average variations per campaign
- Bidding strategy distribution
- Average CPM

### OrganisationKpiSummaryDto
Simplified overview containing:
- Organization basic info
- Key counts (campaigns, creatives, audiences)
- Budget metrics
- User role in organization

### MultipleOrganisationsKpiDto
Aggregated metrics for multiple organizations:
- List of organization summaries
- Combined statistics across all organizations
- Total organization count

## Usage Examples

### Example 1: Get Detailed KPI for a Single Organization
```bash
curl -X GET "http://api.airspot.com/organisations/123e4567-e89b-12d3-a456-426614174000/kpi" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 2: Get KPI Summary for Current User's All Organizations
```bash
curl -X GET "http://api.airspot.com/organisations/kpi/my-organisations/all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Get Summaries for Multiple Specific Organizations
```bash
curl -X GET "http://api.airspot.com/organisations/kpi/organisations/summary?ids=org-1,org-2,org-3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

### Performance Considerations
- Detailed KPI endpoints perform multiple queries; consider caching for frequently accessed data
- Summary endpoints are optimized for quick retrieval
- Recommend using summary endpoints for dashboards and detailed endpoints for reports

### Error Handling
- **404 Not Found**: Organization with given ID does not exist
- **400 Bad Request**: Invalid organization ID format or missing required parameters
- **401 Unauthorized**: User is not authenticated
- **403 Forbidden**: User doesn't have access to the requested organization

## Implementation Details

The KPI service:
1. Creates a database connection to the specific organization's tenant schema
2. Queries the Campaign, Creative, Audience, and AdVariation repositories
3. Aggregates and calculates metrics in memory for accurate results
4. Returns properly formatted DTOs with Swagger documentation

All endpoints validate organization access before returning data, ensuring users can only access organizations they belong to.
