-- Create Campaign Metrics Tables
-- Run this script to manually create the metrics tables

-- 1. Performance Records Table
CREATE TABLE IF NOT EXISTS performance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    date DATE NOT NULL,
    "publisherName" VARCHAR(255) NOT NULL,
    impressions BIGINT NOT NULL,
    spend DECIMAL(12, 2) NOT NULL,
    cpm DECIMAL(10, 6) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance_records
CREATE INDEX IF NOT EXISTS "IDX_performance_tenantId_campaignId" 
    ON performance_records("tenantId", "campaignId");
CREATE INDEX IF NOT EXISTS "IDX_performance_tenantId_campaignId_date" 
    ON performance_records("tenantId", "campaignId", date);
CREATE INDEX IF NOT EXISTS "IDX_performance_tenantId_campaignId_publisher" 
    ON performance_records("tenantId", "campaignId", "publisherName");

-- 2. Time Distribution Table
CREATE TABLE IF NOT EXISTS time_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    impressions BIGINT NOT NULL,
    percentage DECIMAL(8, 6) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for time_distribution
CREATE INDEX IF NOT EXISTS "IDX_time_tenantId_campaignId" 
    ON time_distribution("tenantId", "campaignId");
CREATE INDEX IF NOT EXISTS "IDX_time_tenantId_campaignId_hour" 
    ON time_distribution("tenantId", "campaignId", hour);

-- 3. Reach Metrics Table
CREATE TABLE IF NOT EXISTS reach_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "totalImpressions" BIGINT NOT NULL,
    "uniqueHouseholds" DECIMAL(12, 1) NOT NULL,
    "frequencyPerHousehold" DECIMAL(5, 2) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_reach_tenantId_campaignId" UNIQUE ("tenantId", "campaignId")
);

-- Create unique index for reach_metrics
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reach_tenantId_campaignId" 
    ON reach_metrics("tenantId", "campaignId");

-- 4. Campaign Summaries Table
CREATE TABLE IF NOT EXISTS campaign_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "totalImpressions" BIGINT NOT NULL,
    "totalSpend" DECIMAL(12, 2) NOT NULL,
    "averageCPM" DECIMAL(10, 2) NOT NULL,
    "uniqueHouseholds" DECIMAL(12, 1) NOT NULL,
    "averageFrequency" DECIMAL(5, 2) NOT NULL,
    "totalPublishers" INTEGER NOT NULL,
    "activeDays" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "lastCalculatedAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_summary_tenantId_campaignId" UNIQUE ("tenantId", "campaignId")
);

-- Create unique index for campaign_summaries
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_summary_tenantId_campaignId" 
    ON campaign_summaries("tenantId", "campaignId");

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Campaign metrics tables created successfully!';
END $$;
