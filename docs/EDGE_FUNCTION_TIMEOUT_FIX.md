# Edge Function Timeout Fix

## Problem

Edge Functions have CPU time limits (typically 2 seconds on free tier). Syncing all tables at once can exceed this limit.

## Solution: Batch Upserts

The Edge Function has been optimized to use **batch upserts** instead of individual upserts:

### Before (Slow):
```typescript
// 1000 individual database calls
for (const item of items) {
  await supabase.from("events").upsert(item);
}
```

### After (Fast):
```typescript
// 2 batch calls (500 items each)
await batchUpsert(supabase, "events", items, "event_id", 500);
```

## Performance Improvements

- **Batch size**: 500 items per batch (reduced from 1000 for Edge Functions)
- **Reduced delay**: 50ms between API pages (was 100ms)
- **Batch upserts**: All items processed in batches instead of one-by-one

## Recommended Approach

If syncing all tables still times out, **sync tables individually**:

### Option 1: Sync One Table at a Time

Instead of calling the function without parameters, call it with a specific table:

```bash
# Sync events table only
supabase functions invoke sync-xs2 --data '{"table": "events"}'

# Or with curl
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

### Option 2: Update Cron to Sync Tables Sequentially

Modify your cron to call the function multiple times, one table at a time:

```sql
-- Create a function to sync all tables sequentially via separate calls
CREATE OR REPLACE FUNCTION sync_all_xs2_tables_sequential()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Each table syncs separately (won't timeout)
    -- You'll need to implement this via webhooks or external service
    -- that calls the edge function multiple times
END;
$$;
```

### Option 3: Use Supabase Queue (Advanced)

For very large datasets, consider using Supabase's queue system or breaking syncs into smaller chunks.

## Monitoring

Check if your function is completing:

```bash
# View logs
supabase functions logs sync-xs2

# Look for "CPU Time exceeded" errors
```

## Expected Performance

With batch upserts:
- **Small tables** (sports, countries): < 1 second
- **Medium tables** (venues, teams, tournaments): 1-2 seconds
- **Large tables** (events, categories): 2-5 seconds

If syncing all 8 tables sequentially, expect: **10-20 seconds total**

## If Still Timing Out

1. **Sync tables individually** - Call function 8 times with `?table=events`, etc.
2. **Reduce batch size** - Change batch size from 500 to 250 in the code
3. **Upgrade Supabase plan** - Higher tiers have longer timeout limits
4. **Use background job queue** - Process syncs asynchronously

