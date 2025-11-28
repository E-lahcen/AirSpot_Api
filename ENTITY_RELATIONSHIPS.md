# Entity Relationships Documentation

This document explains the relationships between the core entities in the Airspot advertising campaign management system.

## High-Level Overview

This is an **advertising campaign management system** where:

1. A **Campaign** is the top-level container (e.g., "Summer Sale 2025")
2. Each Campaign can have multiple **Ad Variations** (different versions of ads to test)
3. Each Ad Variation uses a **Creative** (the actual video/image content)
4. Each Ad Variation targets specific **Audiences** (demographics, interests, etc.)

---

## Visual Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER (Owner)                            │
│                      (creates & owns all)                        │
└────────┬────────────────────┬─────────────┬──────────────────────┘
         │                    │             │
         │ owns               │ owns        │ owns
         │                    │             │
         ▼                    ▼             ▼
┏━━━━━━━━━━━━━━━┓    ┏━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━┓
┃   CAMPAIGN    ┃    ┃   CREATIVE    ┃   ┃   AUDIENCE    ┃
┃━━━━━━━━━━━━━━━┃    ┃━━━━━━━━━━━━━━━┃   ┃━━━━━━━━━━━━━━━┃
┃ - name        ┃    ┃ - name        ┃   ┃ - type        ┃
┃ - goal        ┃    ┃ - file_name   ┃   ┃ - target_id   ┃
┃ - budget      ┃    ┃ - s3_key      ┃   ┃ - provider_id ┃
┃ - start/end   ┃    ┃ - mime_type   ┃   ┃               ┃
┃ - status      ┃    ┃ - duration    ┃   ┃               ┃
┗━━━━━┯━━━━━━━━━┛    ┗━━━━━┯━━━━━━━━━┛   ┗━━━━━┯━━━━━━━━━┛
      │                     │                   │
      │ 1                   │ 1                 │ N
      │                     │                   │
      │ has many            │ used by           │ belongs to
      │                     │                   │
      ▼ N                   ▼ N                 ▼ 1
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              AD VARIATION (Ad Version)             ┃
┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃ - name                                             ┃
┃ - campaign_id    (FK → Campaign)                   ┃
┃ - creative_id    (FK → Creative, nullable)         ┃
┃ - bidding_strategy (AUTOMATIC | MANUAL_CPM)        ┃
┃ - cpm_bid                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Detailed Relationships

### 1. Campaign → Ad Variation (One-to-Many)

```
Campaign (1) ──has many──> AdVariation (N)
```

- **Purpose**: A campaign can test multiple ad versions
- **Example**: "Summer Sale" campaign has:
  - Ad Variation A: "Discount Banner"
  - Ad Variation B: "Free Shipping Banner"
  - Ad Variation C: "Limited Time Offer"

**Implementation:**

- `Campaign.ad_variations` - Array of ad variations
- `AdVariation.campaign_id` - Foreign key to campaign
- `AdVariation.campaign` - Many-to-one relation

### 2. Creative → Ad Variation (One-to-Many, Optional)

```
Creative (1) ──used by──> AdVariation (N)
```

- **Purpose**: A creative (video/image) can be reused in multiple ad variations
- **Example**: Same video used across different campaigns
- **Nullable**: An ad variation might not have a creative assigned yet

**Implementation:**

- `Creative.ad_variations` - Array of ad variations using this creative
- `AdVariation.creative_id` - Foreign key to creative (nullable)
- `AdVariation.creative` - Many-to-one relation (nullable)

### 3. Ad Variation → Audience (One-to-Many)

```
AdVariation (1) ──targets──> Audience (N)
```

- **Purpose**: Each ad variation targets multiple audience segments
- **Example**: Ad Variation targets:
  - Audience 1: Demographics (Age 25-34)
  - Audience 2: Geography (New York)
  - Audience 3: Interest (Sports fans)

**Implementation:**

- `AdVariation.audiences` - Array of audience targets
- `Audience.variation_id` - Foreign key to ad variation
- `Audience.ad_variation` - Many-to-one relation

### 4. User → All Entities (One-to-Many, Ownership)

```
User (1) ──owns──> Campaign, Creative, AdVariation, Audience (N)
```

- **Purpose**: Track who created each resource
- **Use Cases**:
  - Access control
  - Audit trails
  - Permission management

**Implementation:**

- All entities have `owner_id` field
- All entities have `owner` relation to User entity

---

## Real-World Example

```
👤 User: "John (Marketing Manager)"
   |
   ├─ 📋 Campaign: "Black Friday 2025"
   │   ├─ Goal: CONVERSIONS
   │   ├─ Budget: $10,000 LIFETIME
   │   ├─ Period: Nov 24 - Nov 30
   │   │
   │   ├─ 📱 Ad Variation 1: "50% Off Banner"
   │   │   ├─ 🎬 Creative: "black_friday_video.mp4"
   │   │   ├─ Bidding: AUTOMATIC
   │   │   └─ 🎯 Audiences:
   │   │       ├─ Demographics: Age 25-45
   │   │       ├─ Geography: USA
   │   │       └─ Interest: Shopping Enthusiasts
   │   │
   │   └─ 📱 Ad Variation 2: "Free Shipping Banner"
   │       ├─ 🎬 Creative: "shipping_promo.jpg"
   │       ├─ Bidding: MANUAL_CPM ($5.00)
   │       └─ 🎯 Audiences:
   │           ├─ Demographics: Age 18-34
   │           └─ Behavior: Frequent Shoppers
   │
   └─ 🎬 Creative Library:
       ├─ "black_friday_video.mp4" (30s, video/mp4)
       └─ "shipping_promo.jpg" (image/jpeg)
```

---

## Cardinality Summary

| Relationship           | Type | Description                             |
| ---------------------- | ---- | --------------------------------------- |
| Campaign → AdVariation | 1:N  | One campaign has many ad variations     |
| Creative → AdVariation | 1:N  | One creative used in many ad variations |
| AdVariation → Audience | 1:N  | One ad variation targets many audiences |
| User → Campaign        | 1:N  | One user owns many campaigns            |
| User → Creative        | 1:N  | One user owns many creatives            |
| User → AdVariation     | 1:N  | One user owns many ad variations        |
| User → Audience        | 1:N  | One user owns many audiences            |

---

## Entity Properties

### Campaign

- **Key Fields:**
  - `name`: Campaign name
  - `goal`: Campaign objective (AWARENESS, CONVERSIONS, TRAFFIC, etc.)
  - `status`: Current state (DRAFT, ACTIVE, PAUSED, etc.)
  - `budget_type`: LIFETIME or DAILY
  - `budget_amount`: Total budget
  - `start_date` / `end_date`: Campaign duration
  - `owner_id`: User who created it
  - `organization_id`: Tenant/organization

### Creative

- **Key Fields:**
  - `name`: Creative name
  - `file_name`: Original file name
  - `s3_key`: AWS S3 storage key
  - `mime_type`: File type (video/mp4, image/jpeg, etc.)
  - `duration`: Video duration (for videos)
  - `file_size`: File size in bytes
  - `owner_id`: User who created it
  - `organization_id`: Tenant/organization

### Ad Variation

- **Key Fields:**
  - `name`: Variation name
  - `campaign_id`: Parent campaign
  - `creative_id`: Associated creative (nullable)
  - `bidding_strategy`: AUTOMATIC or MANUAL_CPM
  - `cpm_bid`: Cost per thousand impressions (for manual bidding)
  - `owner_id`: User who created it
  - `organization_id`: Tenant/organization

### Audience

- **Key Fields:**
  - `variation_id`: Parent ad variation
  - `type`: Targeting type (LOCATION, INTEREST, DEMOGRAPHIC, BEHAVIOR, CUSTOM)
  - `target_id`: Identifier for the target (e.g., "US-CA", "TECH-001")
  - `provider_id`: External provider ID (e.g., from ad platform)
  - `owner_id`: User who created it
  - `organization_id`: Tenant/organization

---

## Use Cases

### A/B Testing

Create multiple ad variations within the same campaign to test which performs better:

```
Campaign: "Product Launch"
  ├─ Variation A: Emphasizes price
  ├─ Variation B: Emphasizes quality
  └─ Variation C: Emphasizes reviews
```

### Audience Segmentation

Target different audience segments with the same ad:

```
Ad Variation: "Summer Sale Banner"
  ├─ Audience 1: Age 18-24, Location: Urban areas
  ├─ Audience 2: Age 25-34, Interest: Fashion
  └─ Audience 3: Age 35-44, Behavior: Previous customers
```

### Creative Reuse

Use the same creative across multiple campaigns:

```
Creative: "Brand Logo Animation"
  ├─ Used in: Campaign A → Variation 1
  ├─ Used in: Campaign B → Variation 3
  └─ Used in: Campaign C → Variation 2
```

---

## Database Schema Notes

- All entities inherit from `BaseEntity` which provides:
  - `id`: UUID primary key
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

- Multi-tenancy is implemented via `organization_id` field in all entities

- Soft deletes are handled at the application level (not shown in entity)

- All foreign keys use UUID type for consistency

- Nullable relationships (e.g., `creative_id` in AdVariation) allow for flexible workflows where not all data is available upfront

---

## Benefits of This Structure

1. **Flexibility**: Campaigns can have multiple variations for A/B testing
2. **Reusability**: Creatives can be shared across campaigns
3. **Precision**: Each variation can target multiple audience segments
4. **Ownership**: Clear tracking of who created what
5. **Multi-tenancy**: Organization isolation through `organization_id`
6. **Scalability**: One-to-many relationships allow unlimited growth
