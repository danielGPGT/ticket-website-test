# XS2 API Database Migrations

This directory contains Supabase migration files for storing XS2 API data locally.

## Tables Created

1. **sports** - Sport types (e.g., FOOTBALL, FORMULA1)
2. **countries** - Country codes (ISO 3 format, e.g., NLD, GBR)
3. **cities** - City names with country codes
4. **venues** - Stadium and venue information
5. **teams** - Team information with logos and colors
6. **tournaments** - Tournament/league information
7. **events** - Event details with sales periods (stored as JSONB)
8. **categories** - Ticket category information with nested JSON fields

## Important Notes

- **Tickets are NOT stored** - Tickets must be fetched in real-time from XS2 API
- All tables match the exact structure of XS2 API responses
- JSONB fields are used for nested objects and arrays:
  - `events.sales_periods` - Array of sales period objects
  - `categories.description` - Multi-language description object
  - `categories.options` - Category options object
  - `categories.files` - Array of file objects
- Array fields use PostgreSQL arrays:
  - `categories.sports_enabled` - TEXT[]
  - `categories.sports_disabled` - TEXT[]

## Running Migrations

### Using Supabase CLI

```bash
# Apply all migrations
supabase db push

# Or apply specific migration
supabase migration up
```

### Manual Application

You can also run these SQL files directly in your Supabase SQL editor or via the Supabase dashboard.

## Migration Order

Migrations are named with timestamps to ensure correct execution order:
1. `20250105000001_create_sports_table.sql`
2. `20250105000002_create_countries_table.sql`
3. `20250105000003_create_cities_table.sql`
4. `20250105000004_create_venues_table.sql`
5. `20250105000005_create_teams_table.sql`
6. `20250105000006_create_tournaments_table.sql`
7. `20250105000007_create_events_table.sql`
8. `20250105000008_create_categories_table.sql`

## Indexes

Each table includes appropriate indexes for:
- Primary keys
- Foreign key relationships (venue_id, tournament_id, etc.)
- Common query fields (sport_type, city, country, etc.)
- JSONB fields (GIN indexes for efficient JSON queries)
- Array fields (GIN indexes for array operations)

## Automatic Timestamps

All tables include:
- `created_at` - Automatically set on insert
- `updated_at` - Automatically updated via trigger function

The `update_updated_at_column()` function is created in the first migration and reused by all subsequent migrations.

