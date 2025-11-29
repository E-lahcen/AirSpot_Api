# Database Connection Issues - Diagnosis & Solutions

## Problem Summary

The backend was experiencing database hangs due to **connection pool exhaustion** caused by connection leaks.

## Root Causes Identified

### 1. **Connection Leak in TenantConnectionService** ⚠️ CRITICAL

**Location:** `src/modules/tenant/services/tenant-connection.service.ts`

**Issue:**

- The service creates `QueryRunner` instances for each request (request-scoped)
- The `cleanup()` method existed but was never called automatically
- Each request consumed a connection that was never returned to the pool
- Eventually all connections were exhausted → database hangs

**Impact:** HIGH - This is the primary cause of database hangs

### 2. **Missing Connection Pool Configuration** ⚠️ HIGH

**Location:** `src/app.module.ts`

**Issue:**

- No connection pool limits configured (max, min connections)
- No idle timeout settings
- No connection acquisition timeout
- PostgreSQL defaults may not be suitable for multi-tenant architecture

**Impact:** HIGH - Without proper limits, the app can't handle connection pressure

### 3. **No Query Timeout Configuration** ⚠️ MEDIUM

**Issue:**

- Long-running queries can hold connections indefinitely
- No visibility into slow queries

**Impact:** MEDIUM - Can contribute to connection exhaustion

### 4. **Startup Migration Overhead** ⚠️ LOW

**Location:** `src/app.module.ts` (onModuleInit)

**Issue:**

- Runs migrations for ALL tenants on startup
- Creates multiple simultaneous connections
- Can delay startup and consume connections

**Impact:** LOW - Only affects startup, but can contribute to initial connection pressure

## Solutions Implemented

### ✅ Fix 1: Connection Pool Configuration

**File:** `src/app.module.ts`

Added PostgreSQL connection pool settings:

```typescript
extra: {
  max: 20,                      // Maximum 20 connections in pool
  min: 2,                       // Keep 2 connections always ready
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout acquiring connection after 5s
},
maxQueryExecutionTime: 10000,   // Log slow queries (>10s)
```

**Benefits:**

- Prevents unlimited connection growth
- Automatically closes idle connections
- Fails fast if pool is exhausted (5s timeout)
- Identifies slow queries

### ✅ Fix 2: Automatic Connection Cleanup

**Files:**

- `src/modules/tenant/interceptors/tenant-connection-cleanup.interceptor.ts` (NEW)
- `src/modules/tenant/tenant.module.ts` (UPDATED)

Created a global interceptor that automatically calls `cleanup()` after EVERY request:

```typescript
@Injectable()
export class TenantConnectionCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      finalize(async () => {
        // Always cleanup, even if request fails
        await this.tenantConnectionService.cleanup();
      })
    );
  }
}
```

**Benefits:**

- Guarantees connections are released after each request
- Works even if request throws an error
- No manual cleanup required

### ✅ Fix 3: Connection Lifecycle Logging

**File:** `src/modules/tenant/services/tenant-connection.service.ts`

Added debug logging to track connection creation and release:

```typescript
this.logger.debug(`Created QueryRunner for schema: ${schema}`);
this.logger.debug(`Released QueryRunner for schema: ${schema}`);
```

**Benefits:**

- Visibility into connection lifecycle
- Easy to spot leaks in logs
- Helps with debugging

### ✅ Fix 4: Connection Monitoring Script

**File:** `scripts/monitor-connections.sql` (NEW)

SQL queries to monitor connection pool health:

- Active connections by state
- Long-running queries
- Connection pool utilization
- Idle connection detection

## How to Verify the Fixes

### 1. Check Application Logs

Look for connection lifecycle logs:

```
[TenantConnectionService] Created QueryRunner for schema: tenant_acme_corp
[TenantConnectionService] Released QueryRunner for schema: tenant_acme_corp
```

If you see many "Created" but few "Released", there's still a leak.

### 2. Monitor Database Connections

Run the monitoring script:

```bash
# Connect to your database
psql -U your_username -d your_database -f scripts/monitor-connections.sql
```

Watch for:

- **Idle connections:** Should decrease over time (30s timeout)
- **Active connections:** Should stay well below 20
- **Long-running queries:** Investigate any queries > 10 seconds

### 3. Load Testing

Simulate high traffic and monitor connection count:

```bash
# Example with Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/v1/your-endpoint
```

Connection count should:

- Rise during load
- Return to baseline (2-5 connections) after load stops
- Never exceed 20 connections

### 4. Check for Warnings

Watch for these log messages:

```
[TypeORM] Slow query detected (>10s)
[TenantConnectionService] Failed to release connection
```

## Additional Recommendations

### 1. Adjust Pool Size Based on Load

Current settings (max: 20, min: 2) are conservative. Adjust based on:

- Number of concurrent users
- Average request duration
- Database server capacity

**Formula:** `max_connections = (number_of_app_instances * max_pool_size) + buffer`

### 2. Enable Connection Pool Metrics

Consider adding metrics collection:

```typescript
// In app.module.ts
poolErrorHandler: (err) => {
  logger.error('Connection pool error:', err);
},
```

### 3. Review Long-Running Queries

Any query taking > 10 seconds should be optimized:

- Add database indexes
- Optimize query logic
- Consider pagination
- Use database query plan analysis (`EXPLAIN ANALYZE`)

### 4. Consider Read Replicas

For read-heavy workloads, use read replicas to distribute load:

```typescript
replication: {
  master: { /* primary DB */ },
  slaves: [{ /* read replica 1 */ }, { /* read replica 2 */ }]
}
```

### 5. Monitor in Production

Set up alerts for:

- Connection pool utilization > 80%
- Idle connections > 50
- Query execution time > 10s
- Connection acquisition timeout errors

## Testing Checklist

- [ ] Application starts without errors
- [ ] Connection logs show create/release pairs
- [ ] Database connection count stays low during idle
- [ ] Load testing doesn't exhaust connections
- [ ] No connection timeout errors under load
- [ ] Idle connections are cleaned up after 30s
- [ ] Slow queries are logged

## Rollback Plan

If issues occur, you can temporarily increase pool size:

```typescript
extra: {
  max: 50,  // Increase if needed
  min: 5,
}
```

Or disable the interceptor (NOT RECOMMENDED):

```typescript
// Comment out in tenant.module.ts
// {
//   provide: APP_INTERCEPTOR,
//   useClass: TenantConnectionCleanupInterceptor,
// },
```

## References

- [TypeORM Connection Options](https://typeorm.io/data-source-options#postgres--cockroachdb-connection-options)
- [node-postgres Pool Configuration](https://node-postgres.com/apis/pool)
- [PostgreSQL Connection Pooling Best Practices](https://www.postgresql.org/docs/current/runtime-config-connection.html)
