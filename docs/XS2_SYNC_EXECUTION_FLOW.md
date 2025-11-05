# XS2 Sync Edge Function - Execution Flow

## What Happens When the Function Runs

### 1. **Function Invocation** (Trigger)
- Function is called via HTTP POST/GET request
- Can be triggered by:
  - Cron job (daily at 2 AM UTC)
  - Manual API call
  - GitHub Actions workflow
  - Database webhook

### 2. **Environment Setup**
```
✅ Checks for environment variables:
   - XS2_API_KEY (required)
   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL (required)
   - SUPABASE_SERVICE_ROLE_KEY (required)
   - XS2_API_BASE (optional, defaults to https://api.xs2event.com/v1)

❌ If any required vars are missing → Returns error 500
```

### 3. **Supabase Client Initialization**
```
✅ Creates Supabase admin client with service role key
   - Uses: createClient(url, serviceRoleKey, { auth: { persistSession: false } })
   - This gives full database access (bypasses RLS)
```

### 4. **Parse Request Parameters**
```
✅ Checks for optional query parameter:
   - ?table=events → Sync only events table
   - No parameter → Sync all tables
```

### 5. **Sync Process (All Tables)**

If no `table` parameter, syncs in this order:

#### **Step 5a: Sync Sports** 🏃
```
1. Fetch from XS2 API: GET https://api.xs2event.com/v1/sports?page_size=100&page=1
2. Parse response: data.sports ?? data.results ?? data.items
3. For each sport:
   - Upsert to Supabase: INSERT ... ON CONFLICT (sport_id) DO UPDATE
   - If new → inserted count +1
   - If existing → updated count +1
4. Check pagination → If more pages, fetch next page
5. Repeat until all pages fetched
6. Result: { table: "sports", inserted: X, updated: X, errors: 0 }
```

#### **Step 5b: Sync Countries** 🌍
```
1. Fetch: GET https://api.xs2event.com/v1/countries?page_size=100&page=1
2. Upsert each country to Supabase
3. Handle pagination
4. Result: { table: "countries", inserted: X, updated: X, errors: 0 }
```

#### **Step 5c: Sync Cities** 🏙️
```
1. Fetch: GET https://api.xs2event.com/v1/cities?page_size=100&page=1
2. Upsert each city (composite key: city + country)
3. Handle pagination
4. Result: { table: "cities", inserted: X, updated: X, errors: 0 }
```

#### **Step 5d: Sync Venues** 🏟️
```
1. Fetch: GET https://api.xs2event.com/v1/venues?page_size=100&page=1
2. For each venue, upsert all 18 fields:
   - venue_id, official_name, country, capacity, city, etc.
3. Handle pagination
4. Result: { table: "venues", inserted: X, updated: X, errors: 0 }
```

#### **Step 5e: Sync Teams** ⚽
```
1. Fetch: GET https://api.xs2event.com/v1/teams?page_size=100&page=1
2. Upsert each team with all fields including:
   - team_id, official_name, logo_filename, colors_svg, etc.
3. Handle pagination
4. Result: { table: "teams", inserted: X, updated: X, errors: 0 }
```

#### **Step 5f: Sync Tournaments** 🏆
```
1. Fetch: GET https://api.xs2event.com/v1/tournaments?page_size=100&page=1
2. Upsert each tournament with dates, seasons, regions
3. Handle pagination
4. Result: { table: "tournaments", inserted: X, updated: X, errors: 0 }
```

#### **Step 5g: Sync Events** 🎫
```
1. Fetch: GET https://api.xs2event.com/v1/events?page_size=100&page=1
2. For each event, upsert all 33 fields including:
   - event_id, event_name, dates, venue_id, tournament_id
   - team_ids (home/visiting), prices, sales_periods (JSONB)
3. Handle pagination
4. Result: { table: "events", inserted: X, updated: X, errors: 0 }
```

#### **Step 5h: Sync Categories** 🎟️
```
1. Fetch: GET https://api.xs2event.com/v1/categories?page_size=100&page=1
2. For each category, upsert with:
   - category_id, category_name, description (JSONB multi-language)
   - options (JSONB), files (JSONB array)
   - sports_enabled (TEXT[]), sports_disabled (TEXT[])
3. Handle pagination
4. Result: { table: "categories", inserted: X, updated: X, errors: 0 }
```

### 6. **Error Handling During Sync**

For each item:
```
✅ Success → inserted count +1
❌ Error → errors count +1, error message stored
   - Continues with next item (doesn't stop)
   - Error logged: "table_id X: error message"
```

### 7. **Pagination Logic**

For each table:
```
Page 1 → Fetch 100 items
Page 2 → Fetch 100 items
...
Page N → Fetch remaining items
Stop when:
  - No items returned
  - Pagination.next_page is null
  - Safety limit reached (1000 pages max)
  
Delay: 100ms between pages (rate limiting protection)
```

### 8. **Calculate Totals**

```
totals = {
  inserted: sum of all inserted counts
  updated: sum of all updated counts (same as inserted for upsert)
  errors: sum of all error counts
}
```

### 9. **Return Response**

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
      "errors": 0,
      "errorMessages": [] // Only if errors > 0
    }
    // ... more tables
  ]
}
```

## Example Timeline

```
00:00:00 - Function invoked
00:00:00 - Environment check ✅
00:00:01 - Supabase client created ✅
00:00:02 - Start sync all tables
00:00:03 - Sports: 5 items synced
00:00:04 - Countries: 195 items synced
00:00:05 - Cities: 500 items synced
00:00:10 - Venues: 200 items synced
00:00:15 - Teams: 800 items synced
00:00:20 - Tournaments: 150 items synced
00:00:45 - Events: 5000 items synced (largest table)
00:01:00 - Categories: 3000 items synced
00:01:02 - Calculate totals
00:01:02 - Return response

Total time: ~62 seconds
Total items: ~9,850 items
```

## What Gets Updated in Database

### Upsert Behavior (ON CONFLICT)
```
New record → INSERT
Existing record (by primary key) → UPDATE all fields
```

### Fields Updated
- All fields from XS2 API response
- `created_at` → Only set on insert (not updated)
- `updated_at` → Auto-updated by database trigger

### What's NOT Synced
- ❌ **Tickets** - Explicitly excluded (must be fetched real-time)
- ❌ Old records that no longer exist in XS2 → Stay in database (not deleted)

## Rate Limiting Protection

```
100ms delay between API pages
Max 1000 pages per table (safety limit)
Max 8 tables = ~8000 API calls max (worst case)
```

## Error Scenarios

### Scenario 1: Missing Environment Variable
```json
{
  "error": "Missing required environment variables",
  "missing": ["XS2_API_KEY"]
}
Status: 500
```

### Scenario 2: XS2 API Error
```
- Individual item errors logged
- Sync continues with other items
- Error count in response
```

### Scenario 3: Database Error
```
- Individual item errors logged
- Sync continues with other items
- Error count in response
```

### Scenario 4: Timeout
```
- Edge Functions have timeout limits
- If full sync takes too long, consider:
  - Syncing tables individually (?table=events)
  - Running multiple smaller syncs
```

## Monitoring

### View Logs
```bash
supabase functions logs sync-xs2
```

### Check Results
- Check response JSON for error counts
- Review `errorMessages` array for specific failures
- Monitor `duration` to track performance

## Daily Sync Impact

**Typical Daily Run:**
- **Time**: ~30-60 seconds
- **API Calls**: ~100-200 calls to XS2 API
- **Database Writes**: ~10,000-50,000 upserts
- **Errors**: Usually 0 (if everything is working)

**After First Sync:**
- Subsequent syncs are faster (mostly updates, not inserts)
- Only changed data is updated
- Database indexes help with upsert performance

