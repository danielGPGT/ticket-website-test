# How to Run XS2 Sync Edge Function Manually

## Method 1: Using Supabase CLI

**Note:** The CLI `invoke` command doesn't support query parameters. Use it for syncing all tables, or use curl for specific tables.

```bash
# Sync all tables (no parameters needed)
supabase functions invoke sync-xs2
```

**To sync a specific table, use curl (Method 2) instead.**

## Method 2: Using curl

### Get Your Credentials

1. **Project Ref**: From your Supabase Dashboard URL
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
   - Or Settings → General → Reference ID

2. **Anon Key**: From Supabase Dashboard
   - Settings → API → anon/public key

### Sync All Tables

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Sync Specific Table (Recommended)

```bash
# Sync events table only
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Sync venues table
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=venues' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Sync sports table
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=sports' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Method 3: Using Supabase Dashboard

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click on **sync-xs2**
3. Click **Invoke Function**
4. (Optional) Add query parameter: `{"table": "events"}`
5. Click **Invoke**

## Method 4: Using Postman or Similar

1. **Method**: POST
2. **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2`
3. **Headers**:
   - `Authorization: Bearer YOUR_ANON_KEY`
   - `Content-Type: application/json`
4. **Query Params** (optional):
   - `table`: `events` (or any table name)

## Quick Reference: Available Tables

- `sports`
- `countries`
- `cities`
- `venues`
- `teams`
- `tournaments`
- `events`
- `categories`

## Example Response

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
      "table": "events",
      "inserted": 5000,
      "updated": 5000,
      "errors": 0
    }
  ]
}
```

## Troubleshooting

### "Function not found"
- Make sure you deployed: `supabase functions deploy sync-xs2`
- Check project ref is correct

### "Unauthorized"
- Verify your anon key is correct
- Check it's in the Authorization header

### Still timing out?
- Sync tables one at a time: `?table=events`
- Check logs: `supabase functions logs sync-xs2`

## Testing Individual Tables

For testing, start with small tables:

```bash
# 1. Sports (smallest, fastest)
supabase functions invoke sync-xs2 --data '{"table": "sports"}'

# 2. Countries
supabase functions invoke sync-xs2 --data '{"table": "countries"}'

# 3. Cities
supabase functions invoke sync-xs2 --data '{"table": "cities"}'

# 4. Then larger tables
supabase functions invoke sync-xs2 --data '{"table": "events"}'
```

