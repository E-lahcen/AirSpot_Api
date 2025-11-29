-- Monitor PostgreSQL connection pool usage
-- Run this query to see active connections and identify potential leaks

SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    state_change,
    query_start,
    NOW() - query_start AS query_duration,
    wait_event_type,
    wait_event,
    LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid != pg_backend_pid()
ORDER BY query_start DESC;

-- Summary of connection states
SELECT 
    state,
    COUNT(*) as connection_count,
    MAX(NOW() - state_change) as max_idle_time
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

-- Find long-running queries (potential connection hogs)
SELECT 
    pid,
    NOW() - query_start AS duration,
    usename,
    state,
    LEFT(query, 200) AS query
FROM pg_stat_activity
WHERE datname = current_database()
  AND state != 'idle'
  AND NOW() - query_start > INTERVAL '5 seconds'
ORDER BY duration DESC;

-- Check connection pool limits
SELECT 
    setting AS max_connections,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) AS current_connections,
    setting::int - (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) AS available_connections
FROM pg_settings
WHERE name = 'max_connections';
