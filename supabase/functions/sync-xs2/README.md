# XS2 Sync Edge Function

Supabase Edge Function to sync XS2 API data to Supabase tables.

## Setup

### 1. Set Environment Variables

In your Supabase project, go to **Settings > Edge Functions > Secrets** and add:

- `XS2_API_KEY` - Your XS2 API key (same as in your Next.js `.env.local`)
- `SUPABASE_URL` - Your Supabase project URL (same as `NEXT_PUBLIC_SUPABASE_URL` in your Next.js setup)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (same as in your Next.js `.env.local`)
- `XS2_API_BASE` (optional) - XS2 API base URL (defaults to https://api.xs2event.com/v1, same as Next.js)

**Note:** Edge Functions can also use `NEXT_PUBLIC_SUPABASE_URL` if `SUPABASE_URL` is not set, for consistency with your Next.js setup.

### 2. Deploy the Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy sync-xs2
```

### 3. Set Up Daily Cron

Use Supabase's pg_cron extension to schedule daily syncs:

1. Enable pg_cron in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. Create a function to call the edge function:
```sql
CREATE OR REPLACE FUNCTION sync_xs2_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the edge function via HTTP
  PERFORM net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/sync-xs2',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;
```

3. Schedule the cron job (runs daily at 2 AM UTC):
```sql
SELECT cron.schedule(
  'sync-xs2-daily',
  '0 2 * * *',
  'SELECT sync_xs2_data();'
);
```

**Note:** For the HTTP call, you'll need to enable the `http` extension or use `pg_net` extension. Alternatively, you can use Supabase's Database Webhooks feature.

### Alternative: Manual Trigger

You can also trigger the function manually:

```bash
# Using Supabase CLI
supabase functions invoke sync-xs2

# Using curl
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/sync-xs2' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Query Parameters

- `table` - Optional. Sync only specific table (sports, countries, cities, venues, teams, tournaments, events, categories)

Example:
```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/sync-xs2?table=events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Response Format

```json
{
  "success": true,
  "duration": "45230ms",
  "totals": {
    "inserted": 15234,
    "updated": 15234,
    "errors": 0
  },
  "results": [
    {
      "table": "sports",
      "inserted": 5,
      "updated": 5,
      "errors": 0
    },
    {
      "table": "events",
      "inserted": 1234,
      "updated": 1234,
      "errors": 0
    }
  ]
}
```

## Benefits of Edge Functions

- ✅ **Runs on Supabase infrastructure** - Closer to database, lower latency
- ✅ **Native integration** - Easy to set up with pg_cron
- ✅ **No external dependencies** - No need for Vercel cron or external services
- ✅ **Automatic scaling** - Handles traffic spikes automatically
- ✅ **Better error handling** - Integrated with Supabase logging

