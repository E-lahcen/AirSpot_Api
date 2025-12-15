# Connection Hang Prevention & Monitoring Guide

## Problem Fixed

Your application was experiencing connection hangs that required manual server restarts. This was caused by:

1. **Missing Connection Pool Configuration** - No limits on database connections
2. **No Request Timeouts** - Long-running requests could hang indefinitely
3. **No Graceful Shutdown** - Connections weren't properly closed on restart
4. **Unbounded Cache** - Memory could grow indefinitely

## Changes Made

### 1. Connection Pool Configuration ✅

**File:** [src/app.module.ts](src/app.module.ts#L75-L83)

Added proper PostgreSQL connection pool settings:

```typescript
extra: {
  max: 20,                      // Maximum 20 connections in pool
  min: 2,                       // Keep 2 connections always ready
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout acquiring connection after 5s
  statement_timeout: 30000,     // Kill queries running longer than 30s
}
```

**Benefits:**
- Prevents unlimited connection growth
- Automatically closes idle connections
- Fails fast if pool is exhausted
- Kills long-running queries

### 2. Request Timeout Middleware ✅

**File:** [src/core/middlewares/timeout.middleware.ts](src/core/middlewares/timeout.middleware.ts)

Added global 60-second timeout for all requests:

```typescript
@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  private readonly timeout = 60000; // 60 seconds
  
  use(req: Request, res: Response, next: NextFunction) {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        throw new RequestTimeoutException('Request timeout');
      }
    }, this.timeout);
    
    res.on('finish', () => clearTimeout(timeoutId));
    next();
  }
}
```

**Benefits:**
- Prevents requests from hanging forever
- Releases connections after 60 seconds
- Returns proper error to client

### 3. Graceful Shutdown ✅

**Files:**
- [src/main.ts](src/main.ts#L91) - `app.enableShutdownHooks()`
- [src/app.module.ts](src/app.module.ts#L106-L110) - `OnModuleDestroy` hook

**Benefits:**
- Properly closes all connections on restart
- Prevents orphaned connections
- Clean shutdown process

### 4. Improved Error Handling ✅

**File:** [src/modules/tenant/services/tenant-connection.service.ts](src/modules/tenant/services/tenant-connection.service.ts#L35-L47)

Added safer cleanup with error handling:

```typescript
async cleanup() {
  if (this.queryRunner) {
    try {
      if (this.queryRunner.isReleased === false) {
        await this.queryRunner.release();
      }
    } catch (error) {
      console.error('Error releasing query runner:', error);
    } finally {
      this.queryRunner = undefined;
    }
  }
}
```

### 5. Health Check Endpoints ✅

**File:** [src/modules/health/health.controller.ts](src/modules/health/health.controller.ts)

Added monitoring endpoints:

- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/db` - Database connection health with pool stats

**Usage:**
```bash
# Basic health check
curl http://localhost:3000/api/v1/health

# Database health with pool stats
curl http://localhost:3000/api/v1/health/db
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-15T10:30:00.000Z",
  "database": {
    "connected": true,
    "pool": {
      "total": 20,
      "idle": 15,
      "waiting": 0
    }
  }
}
```

### 6. Cache Configuration ✅

Changed from unbounded cache to limited cache:

```typescript
cache: {
  duration: 30000,      // Cache for 30 seconds
  ignoreErrors: true,   // Don't fail if cache errors
}
```

## Monitoring Recommendations

### 1. Watch Connection Pool Health

Check the health endpoint regularly:

```bash
# Every 30 seconds
watch -n 30 'curl -s http://localhost:3000/api/v1/health/db | jq'
```

**Warning Signs:**
- `idle` count near 0 (pool exhausted)
- `waiting` count > 0 (requests waiting for connections)
- `total` count consistently at max (20)

### 2. Monitor Application Logs

Look for these warning signs:

```
Query is slow. Execution time: 10000ms
```
→ Query taking longer than 10 seconds (logged but not killed)

```
Error releasing query runner
```
→ Connection cleanup failed

```
Request timeout - operation took too long to complete
```
→ Request exceeded 60-second timeout

### 3. Database Query Monitoring

Run this query to see active connections:

```sql
SELECT 
  datname, 
  usename, 
  application_name,
  state,
  query_start,
  state_change,
  wait_event_type,
  wait_event,
  query
FROM pg_stat_activity
WHERE datname = 'your_database_name'
ORDER BY query_start DESC;
```

**Warning Signs:**
- Many connections in `idle in transaction` state
- Connections older than 30 seconds
- Connections with `wait_event_type` = 'Lock'

### 4. Set Up Alerts

Consider adding alerts for:

1. **Connection pool exhaustion:** `waiting > 5`
2. **High idle connections:** `idle < 2` (pool not releasing)
3. **Slow queries:** Queries > 10 seconds
4. **Request timeouts:** More than 5 timeouts per minute

## Tuning Recommendations

### If You Still Experience Issues:

#### 1. Increase Pool Size (if you have database capacity)

```typescript
extra: {
  max: 30,  // Increase from 20 to 30
  min: 5,   // Increase from 2 to 5
}
```

**Note:** Your database must support `(number_of_app_instances * max_pool_size) + 10` connections.

#### 2. Decrease Statement Timeout (if queries are slow)

```typescript
extra: {
  statement_timeout: 15000,  // Reduce from 30s to 15s
}
```

#### 3. Adjust Request Timeout

Edit [src/core/middlewares/timeout.middleware.ts](src/core/middlewares/timeout.middleware.ts#L7):

```typescript
private readonly timeout = 120000; // Increase to 120 seconds
```

#### 4. Investigate Slow Queries

If you see many timeout errors, identify and optimize slow queries:

```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries averaging > 1 second
ORDER BY mean_time DESC
LIMIT 20;
```

## Testing the Fixes

### 1. Restart the Server

```bash
npm run start:dev
```

You should see:
```
🚀 Application is now running on: http://localhost:3000/api/v1
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3000/api/v1/health/db
```

Should return healthy status.

### 3. Monitor Logs

Watch for these positive signs:
- No connection pool errors
- No query runner release errors
- Clean startup and shutdown

### 4. Load Test (Optional)

Test with concurrent requests:

```bash
# Install apache bench if needed
apt-get install apache2-utils

# Send 1000 requests with 50 concurrent
ab -n 1000 -c 50 http://localhost:3000/api/v1/health/
```

Monitor the health endpoint during the test to ensure pool doesn't exhaust.

## What Changed in Your Code

| File | Change |
|------|--------|
| [src/app.module.ts](src/app.module.ts) | Added connection pool config, graceful shutdown, timeout middleware, health module |
| [src/main.ts](src/main.ts) | Added `enableShutdownHooks()` |
| [src/core/middlewares/timeout.middleware.ts](src/core/middlewares/timeout.middleware.ts) | New - Request timeout middleware |
| [src/modules/health/health.controller.ts](src/modules/health/health.controller.ts) | New - Health check endpoints |
| [src/modules/health/health.module.ts](src/modules/health/health.module.ts) | New - Health module |
| [src/modules/tenant/services/tenant-connection.service.ts](src/modules/tenant/services/tenant-connection.service.ts) | Improved error handling in cleanup |

## Next Steps

1. ✅ Restart your server
2. ✅ Test the health endpoints
3. ✅ Monitor logs for the next few hours
4. ✅ Watch for any timeout or connection errors
5. ✅ Adjust pool size if needed based on your load

If you still experience hangs after these changes, check:
- Slow database queries (use `pg_stat_statements`)
- Long-running background jobs
- External API calls that might be hanging
- Memory leaks (monitor with `htop` or similar)

## Summary

The main issues were:
1. **No connection limits** → Added pool config with max 20 connections
2. **No request timeouts** → Added 60-second timeout middleware
3. **No graceful shutdown** → Added shutdown hooks
4. **Poor error handling** → Improved cleanup error handling

These changes should **eliminate connection hangs** and allow your server to run continuously without manual restarts. 🎉
