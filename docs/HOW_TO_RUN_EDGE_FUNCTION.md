# How to Run the XS2 Sync Edge Function

## Quick Start Guide

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Or if you prefer without global install:
```bash
npx supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Link Your Project

```bash
supabase link --project-ref your-project-ref
```

**Find your project ref:**
- Go to your Supabase Dashboard
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Or in Settings → General → Reference ID

### Step 4: Set Environment Variables (Secrets)

In Supabase Dashboard:
1. Go to **Settings → Edge Functions → Secrets**
2. Click **Add Secret** for each:
   - `XS2_API_KEY` = Your XS2 API key (from `.env.local`)
   - `SUPABASE_URL` = Your Supabase URL (same as `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key (from `.env.local`)

**Or use CLI:**
```bash
supabase secrets set XS2_API_KEY=your-key-here
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Deploy the Function

```bash
supabase functions deploy sync-xs2
```

You should see:
```
Deploying function sync-xs2...
Function sync-xs2 deployed successfully!
```

### Step 6: Run the Function

#### Option A: Using Supabase CLI (Sync All Tables)

```bash
# Sync all tables
supabase functions invoke sync-xs2
```

**Note:** CLI doesn't support query parameters. Use curl (below) to sync specific tables.

#### Option B: Using curl (Recommended for Specific Tables)

```bash
# Sync all tables
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Sync specific table (recommended to avoid timeout)
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

Replace:
- `YOUR_PROJECT_REF` with your actual project ref (from Dashboard URL)
- `YOUR_ANON_KEY` with your Supabase anon key (Settings → API → anon/public key)

## Test Locally (Optional)

Before deploying, you can test locally:

```bash
# Start local Supabase (if you have it set up)
supabase start

# Serve the function locally
supabase functions serve sync-xs2

# In another terminal, invoke it
curl -X POST http://localhost:54321/functions/v1/sync-xs2 \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## View Logs

After running, check the logs:

```bash
# Using CLI
supabase functions logs sync-xs2

# Or view in Dashboard
# Go to Edge Functions → sync-xs2 → Logs
```

## Example Response

When successful, you'll see:

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
      "inserted": 5000,
      "updated": 5000,
      "errors": 0
    }
    // ... more tables
  ]
}
```

## Troubleshooting

### Error: "Function not found"
- Make sure you deployed: `supabase functions deploy sync-xs2`
- Check you're using the correct project ref

### Error: "Missing required environment variables"
- Check secrets are set in Dashboard or via CLI
- Verify secret names match exactly (case-sensitive)

### Error: "Unauthorized"
- Make sure you're using the correct anon key
- Check the Authorization header is formatted correctly

### Function Times Out
- Try syncing one table at a time: `?table=events`
- Check Supabase function timeout limits
- Consider splitting into multiple smaller syncs

## Set Up Daily Automatic Run

See [XS2_SYNC_EDGE_FUNCTION.md](./XS2_SYNC_EDGE_FUNCTION.md) for cron setup options.

