# XS2 Sync - Supabase Edge Function Setup

This guide explains how to use the Supabase Edge Function for XS2 data synchronization.

## Why Edge Functions?

✅ **Better Performance** - Runs on Supabase infrastructure, closer to your database  
✅ **Simpler Setup** - Native integration with Supabase cron (pg_cron)  
✅ **No External Dependencies** - No need for Vercel cron or third-party services  
✅ **Automatic Scaling** - Handles large data syncs automatically  
✅ **Integrated Logging** - View logs directly in Supabase dashboard  

## Quick Start

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login and Link Project

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref
```

Your project ref can be found in your Supabase project settings URL:
`https://supabase.com/dashboard/project/your-project-ref`

### 3. Set Environment Variables

In Supabase Dashboard:
1. Go to **Settings > Edge Functions > Secrets**
2. Add the following secrets (use the same values as your Next.js `.env.local`):

```
XS2_API_KEY=your-xs2-api-key
SUPABASE_URL=your-supabase-url (same as NEXT_PUBLIC_SUPABASE_URL)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** The Edge Function will try `SUPABASE_URL` first, then fall back to `NEXT_PUBLIC_SUPABASE_URL` for consistency with your Next.js setup.

### 4. Deploy the Function

```bash
supabase functions deploy sync-xs2
```

### 5. Test the Function

```bash
# Test locally (if you have Supabase running locally)
supabase functions serve sync-xs2

# Or invoke the deployed function
supabase functions invoke sync-xs2
```

## Set Up Daily Cron

### Option 1: External Cron Service (Easiest - Recommended)

The simplest way to trigger the edge function daily is using an external cron service:

1. **Use cron-job.org or EasyCron:**
   - Create a new cron job
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2`
   - Method: POST
   - Headers:
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
   - Schedule: Daily at 2 AM UTC (`0 2 * * *`)

2. **Or use GitHub Actions** (free):
   - Create `.github/workflows/sync-xs2.yml`:
   ```yaml
   name: Sync XS2 Data
   on:
     schedule:
       - cron: '0 2 * * *'  # Daily at 2 AM UTC
     workflow_dispatch:
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Sync
           run: |
             curl -X POST \
               "https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/sync-xs2" \
               -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
               -H "Content-Type: application/json"
   ```
   - Add secrets in GitHub: `SUPABASE_PROJECT_REF` and `SUPABASE_SERVICE_ROLE_KEY`

### Option 2: Using pg_cron (Advanced)

1. **Enable pg_cron extension** in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. **Create a function to call the edge function**:

Since pg_cron doesn't directly support HTTP calls, you have a few options:

#### Option A: Using pg_net extension (if available)

```sql
CREATE OR REPLACE FUNCTION sync_xs2_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$;
```

#### Option B: Using Database Webhooks (Easier)

1. Go to **Database > Webhooks** in Supabase Dashboard
2. Create a new webhook:
   - **Name**: `sync-xs2-cron`
   - **Table**: Any table (just for triggering)
   - **Events**: After Insert
   - **Type**: HTTP Request
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2`
   - **HTTP Method**: POST
   - **HTTP Headers**: 
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```

3. Create a trigger function that calls the webhook:

```sql
-- Create a simple table for cron triggers
CREATE TABLE IF NOT EXISTS cron_triggers (
  id SERIAL PRIMARY KEY,
  trigger_name TEXT UNIQUE,
  last_run TIMESTAMP WITH TIME ZONE
);

-- Create function to trigger sync
CREATE OR REPLACE FUNCTION trigger_xs2_sync()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert a record to trigger the webhook
  INSERT INTO cron_triggers (trigger_name, last_run)
  VALUES ('xs2_sync', NOW())
  ON CONFLICT (trigger_name) 
  DO UPDATE SET last_run = NOW();
END;
$$;

-- Schedule the cron job (runs daily at 2 AM UTC)
SELECT cron.schedule(
  'sync-xs2-daily',
  '0 2 * * *',
  'SELECT trigger_xs2_sync();'
);
```

#### Option C: Direct HTTP call with curl in a script

For more control, you can create a simple script that calls the edge function and use a cron service to trigger it.

### Option 2: Using Supabase Database Webhooks (Simpler)

1. Go to **Database > Webhooks** in Supabase Dashboard
2. Create webhook pointing to your edge function
3. Use a scheduled job or external cron to trigger it

## Manual Trigger

### Using Supabase CLI

```bash
supabase functions invoke sync-xs2
```

### Using curl

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Sync Specific Table

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Monitoring

### View Logs

```bash
# Using Supabase CLI
supabase functions logs sync-xs2

# Or view in Supabase Dashboard
# Go to Edge Functions > sync-xs2 > Logs
```

### Check Cron Job Status

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-xs2-daily')
ORDER BY start_time DESC
LIMIT 10;
```

## Troubleshooting

### Function Not Found

- Verify the function is deployed: `supabase functions list`
- Check project ref is correct

### Authentication Errors

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Function secrets
- Check the key has proper permissions

### Timeout Errors

- Edge functions have a timeout limit (default 60 seconds)
- Consider syncing tables individually if full sync takes too long
- Use the `table` query parameter to sync one table at a time

### Rate Limiting

- The function includes 100ms delays between API pages
- If you hit rate limits, increase the delay in the function code

## Comparison: Edge Function vs Next.js API Route

| Feature | Edge Function | Next.js API Route |
|---------|--------------|------------------|
| Location | Supabase infrastructure | Your hosting (Vercel, etc.) |
| Latency | Lower (closer to DB) | Higher |
| Cron Setup | pg_cron (native) | External service needed |
| Scaling | Automatic | Depends on hosting |
| Cost | Included in Supabase | Depends on hosting |
| Logging | Supabase dashboard | Hosting platform |

## Next Steps

1. Deploy the edge function
2. Set up daily cron using one of the methods above
3. Monitor the first few syncs to ensure everything works
4. Set up alerts for sync failures (optional)

For more details, see the [Edge Function README](../supabase/functions/sync-xs2/README.md).

