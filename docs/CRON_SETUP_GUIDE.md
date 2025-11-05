# XS2 Sync Cron Setup Guide

This guide shows you how to set up automatic daily syncing using PostgreSQL cron (pg_cron).

## Method 1: Database Webhook (Easiest - Recommended) ✅

### Step 1: Run the Migration

The migrations are already created. Apply them:

```bash
# If using Supabase CLI
supabase db push

# Or manually run in Supabase SQL Editor:
# - supabase/migrations/20250105000010_setup_xs2_sync_cron_simple.sql
```

### Step 2: Set Up Database Webhook

1. Go to **Supabase Dashboard → Database → Webhooks**
2. Click **"Create a new webhook"**
3. Configure:
   - **Name**: `xs2-sync-webhook`
   - **Table**: `xs2_sync_triggers`
   - **Events**: Check **"After Insert"**
   - **Type**: **HTTP Request**
   - **HTTP Method**: `POST`
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2`
   - **HTTP Headers**:
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
4. Click **Save**

### Step 3: Test It

Run this SQL to test:

```sql
SELECT trigger_xs2_sync();
```

This will:
1. Insert a record into `xs2_sync_triggers`
2. Trigger the webhook
3. Webhook calls your Edge Function
4. Edge Function syncs all XS2 data

### How It Works

```
Daily at 2 AM UTC:
  pg_cron → trigger_xs2_sync() 
  → Inserts into xs2_sync_triggers 
  → Database webhook fires 
  → Calls Edge Function 
  → Syncs all XS2 data ✅
```

## Method 2: Direct HTTP Call (Advanced)

If you have `pg_net` extension enabled, you can call the Edge Function directly:

### Step 1: Enable pg_net

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Step 2: Set Configuration

```sql
-- Set your project ref (get from Supabase URL)
ALTER DATABASE postgres SET app.settings.project_ref = 'your-project-ref';

-- Set service role key
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

### Step 3: Create HTTP Function

Uncomment the HTTP function in migration `20250105000010_setup_xs2_sync_cron_simple.sql`:

```sql
-- Function to call Edge Function directly via HTTP
CREATE OR REPLACE FUNCTION call_xs2_sync_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_ref TEXT;
    service_role_key TEXT;
    function_url TEXT;
    response_status INTEGER;
BEGIN
    project_ref := current_setting('app.settings.project_ref', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/sync-xs2';
    
    SELECT status INTO response_status
    FROM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || service_role_key,
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    
    RAISE NOTICE 'XS2 sync function called. Response status: %', response_status;
END;
$$;

-- Schedule it
SELECT cron.schedule(
    'xs2-sync-daily-http',
    '0 2 * * *',
    'SELECT call_xs2_sync_edge_function();'
);
```

## Verify Cron Job

### View All Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

### View Job History

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'xs2-sync-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

### View Recent Sync Triggers

```sql
SELECT * FROM xs2_sync_triggers 
ORDER BY triggered_at DESC 
LIMIT 10;
```

### View Sync Status

```sql
SELECT * FROM xs2_sync_status;
```

## Manual Testing

### Test the Trigger Function

```sql
SELECT trigger_xs2_sync();
```

### Check Webhook Fired

```sql
SELECT * FROM xs2_sync_triggers 
ORDER BY triggered_at DESC 
LIMIT 1;
```

## Troubleshooting

### Cron Job Not Running

1. Check if pg_cron is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check job status:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'xs2-sync-daily';
   ```

3. Check recent runs:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'xs2-sync-daily')
   ORDER BY start_time DESC LIMIT 5;
   ```

### Webhook Not Firing

1. Check webhook is configured in Dashboard
2. Test webhook manually:
   ```sql
   INSERT INTO xs2_sync_triggers (trigger_type, status) 
   VALUES ('manual_test', 'testing');
   ```
3. Check webhook logs in Dashboard → Database → Webhooks → xs2-sync-webhook

### Edge Function Not Responding

1. Check Edge Function is deployed:
   ```bash
   supabase functions list
   ```

2. Check Edge Function logs:
   ```bash
   supabase functions logs sync-xs2
   ```

3. Test Edge Function manually:
   ```bash
   supabase functions invoke sync-xs2
   ```

## Schedule Options

Current schedule: `0 2 * * *` (Daily at 2 AM UTC)

To change schedule, update the cron expression:

```sql
-- Daily at 3 AM UTC
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'xs2-sync-daily'),
    schedule := '0 3 * * *'
);

-- Twice daily (2 AM and 2 PM UTC)
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'xs2-sync-daily'),
    schedule := '0 2,14 * * *'
);

-- Every 6 hours
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'xs2-sync-daily'),
    schedule := '0 */6 * * *'
);
```

### Cron Expression Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

Examples:
- `0 2 * * *` - Daily at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 2,14 * * *` - Twice daily (2 AM and 2 PM)
- `0 0 * * 0` - Weekly on Sunday at midnight

## Remove Cron Job

If you need to remove the scheduled job:

```sql
SELECT cron.unschedule('xs2-sync-daily');
```

## Summary

✅ **Method 1 (Webhook)** is recommended because:
- No need for pg_net extension
- Easy to set up via Dashboard
- Easy to monitor and debug
- Works out of the box

The cron job will automatically run daily at 2 AM UTC and sync all your XS2 data!

