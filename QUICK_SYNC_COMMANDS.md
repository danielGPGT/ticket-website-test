# Quick Sync Commands

## ✅ Correct Way to Run Edge Function

### Sync All Tables (CLI)

```bash
supabase functions invoke sync-xs2
```

### Sync Specific Table (curl - Required)

**Get your credentials first:**
- Project Ref: From Dashboard URL → `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Anon Key: Settings → API → anon/public key

```bash
# Sync events table
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=events" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Sync sports table (smallest, fastest test)
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=sports" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Sync venues table
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=venues" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Available Tables

- `sports` (start here - smallest)
- `countries`
- `cities`
- `venues`
- `teams`
- `tournaments`
- `events` (largest)
- `categories`

## Windows PowerShell

If using PowerShell, use double quotes:

```powershell
curl -X POST `
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2?table=events" `
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

