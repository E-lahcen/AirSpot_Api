# Campaign Metrics API

## Overview
This document describes the Campaign Metrics endpoints for managing campaign performance data, time distribution, reach metrics, and summary statistics.

## Endpoints

### 1. Bulk Upsert Campaign Metrics
**POST** `/campaigns/metrics/bulk-upsert`

Insert or update all metrics data for a campaign in a single transaction.

#### Authentication
Requires Bearer token authentication.

#### Request Body
```json
{
  "tenantId": "tenant_123e4567-e89b-12d3-a456-426614174000",
  "campaignId": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
  
  "campaign": {
    "tenantId": "tenant_123e4567-e89b-12d3-a456-426614174000",
    "id": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
    "advertiser": "Executive Health",
    "campaignName": "EH",
    "adGroup": "EHTV4",
    "currency": "EUR",
    "startDate": "2025-11-12T00:00:00.000Z",
    "endDate": "2025-12-04T23:59:59.999Z",
    "status": "active",
    "targetHouseholds": 200000,
    "totalBudget": 10000.00,
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2025-11-12T00:00:00.000Z",
    "updatedAt": "2025-12-04T23:59:59.999Z",
    "createdBy": "user_123e4567-e89b-12d3-a456-426614174222",
    "updatedBy": "user_123e4567-e89b-12d3-a456-426614174222"
  },

  "performanceRecords": [
    {
      "tenantId": "tenant_123e4567-e89b-12d3-a456-426614174000",
      "campaignId": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
      "date": "2025-11-12",
      "publisherName": "MAX",
      "impressions": 142,
      "spend": 3.56,
      "cpm": 25.070423
    }
  ],

  "timeDistribution": [
    {
      "tenantId": "tenant_123e4567-e89b-12d3-a456-426614174000",
      "campaignId": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
      "hour": 0,
      "impressions": 10856,
      "percentage": 0.032017
    }
  ],

  "reachMetrics": {
    "tenantId": "tenant_123e4567-e89b-12d3-a456-426614174000",
    "campaignId": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
    "totalImpressions": 339069,
    "uniqueHouseholds": 169534.5,
    "frequencyPerHousehold": 2.0
  },

  "campaignSummary": {
    "tenantId": "tenant_123e4567-e89b-12d3-a456-426614174000",
    "campaignId": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
    "totalImpressions": 339069,
    "totalSpend": 5920.50,
    "averageCPM": 17.46,
    "uniqueHouseholds": 169534.5,
    "averageFrequency": 2.0,
    "totalPublishers": 15,
    "activeDays": 23,
    "startDate": "2025-11-12",
    "endDate": "2025-12-04",
    "lastCalculatedAt": "2025-12-04T14:30:00.000Z"
  }
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Campaign metrics upserted successfully",
  "data": {
    "campaignId": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
    "performanceRecordsCount": 150,
    "timeDistributionCount": 24,
    "reachMetricsUpdated": true,
    "summaryUpdated": true
  }
}
```

#### Error Responses
- **400 Bad Request**: Invalid request payload
- **404 Not Found**: Campaign not found
- **401 Unauthorized**: Missing or invalid authentication token

---

### 2. Get Campaign Metrics
**GET** `/campaigns/:campaignId/metrics`

Retrieve all metrics data for a specific campaign.

#### Authentication
Requires Bearer token authentication.

#### URL Parameters
- `campaignId` (string, required): The UUID of the campaign

#### Response (200 OK)
```json
{
  "campaign": {
    "id": "campaign_987fcdeb-51a2-43f7-8c9d-426614174111",
    "name": "Executive Health Campaign",
    "status": "ACTIVE",
    ...
  },
  "performanceRecords": [
    {
      "id": "perf_001",
      "date": "2025-11-12",
      "publisherName": "MAX",
      "impressions": 142,
      "spend": 3.56,
      "cpm": 25.070423
    }
  ],
  "timeDistribution": [
    {
      "hour": 0,
      "impressions": 10856,
      "percentage": 0.032017
    }
  ],
  "reachMetrics": {
    "totalImpressions": 339069,
    "uniqueHouseholds": 169534.5,
    "frequencyPerHousehold": 2.0
  },
  "summary": {
    "totalImpressions": 339069,
    "totalSpend": 5920.50,
    "averageCPM": 17.46,
    "uniqueHouseholds": 169534.5,
    "averageFrequency": 2.0,
    "totalPublishers": 15,
    "activeDays": 23,
    "startDate": "2025-11-12",
    "endDate": "2025-12-04"
  }
}
```

#### Error Responses
- **404 Not Found**: Campaign not found
- **401 Unauthorized**: Missing or invalid authentication token

---

## Database Schema

### performance_records
- Stores daily performance data by publisher
- Indexed on: tenantId, campaignId, date, publisherName
- Unique constraint: tenantId + campaignId + date + publisherName

### time_distribution
- Stores hourly impression distribution (0-23 hours)
- Indexed on: tenantId, campaignId, hour
- Unique constraint: tenantId + campaignId + hour

### reach_metrics
- Stores reach and frequency metrics (OneToOne with campaign)
- Indexed on: tenantId, campaignId (unique)

### campaign_summaries
- Stores pre-calculated aggregate metrics (OneToOne with campaign)
- Indexed on: tenantId, campaignId (unique)

## Notes

1. **Transaction Safety**: All bulk upsert operations are performed within a transaction to ensure data consistency.

2. **Upsert Logic**: 
   - If a record exists (based on unique constraints), it will be updated
   - If it doesn't exist, a new record will be created

3. **Tenant Isolation**: The `tenantId` from the authenticated user is automatically applied to ensure proper multi-tenancy isolation.

4. **Data Validation**: All numeric fields are validated, and proper precision/scale is maintained for decimal values.

## Migration Required

Before using these endpoints, run the migration to create the necessary database tables:

```bash
pnpm run migration:generate -- AddCampaignMetricsTables
pnpm run migration:run
```
