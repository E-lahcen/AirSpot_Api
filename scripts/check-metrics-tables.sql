-- Script to check and optionally drop campaign metrics tables
-- Run this if you need to start fresh with the metrics tables

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('performance_records', 'time_distribution', 'reach_metrics', 'campaign_summaries');

-- To drop the tables and start fresh, uncomment the following:
-- DROP TABLE IF EXISTS performance_records CASCADE;
-- DROP TABLE IF EXISTS time_distribution CASCADE;
-- DROP TABLE IF EXISTS reach_metrics CASCADE;
-- DROP TABLE IF EXISTS campaign_summaries CASCADE;

-- List all indexes on these tables
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('performance_records', 'time_distribution', 'reach_metrics', 'campaign_summaries')
ORDER BY tablename, indexname;
