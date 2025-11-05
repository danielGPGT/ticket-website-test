# XS2 API to Database Schema Reference

This document maps XS2 API response fields to the corresponding database table columns.

## Sports Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `sport_id` | `sport_id` | TEXT | Primary Key |
| `image` | `image` | TEXT | Path to image in Supabase Storage (e.g., "sports/{sport_id}.webp") or full URL for external images |

## Countries Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `country` | `country` | TEXT | Primary Key (ISO 3 format) |

## Cities Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `city` | `city` | TEXT | Primary Key (part 1) |
| `country` | `country` | TEXT | Primary Key (part 2) |

## Venues Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `venue_id` | `venue_id` | TEXT | Primary Key |
| `official_name` | `official_name` | TEXT | |
| `country` | `country` | TEXT | |
| `popular_stadium` | `popular_stadium` | BOOLEAN | |
| `venue_type` | `venue_type` | TEXT | |
| `capacity` | `capacity` | INTEGER | |
| `city` | `city` | TEXT | |
| `province` | `province` | TEXT | |
| `latitude` | `latitude` | TEXT | Stored as TEXT (may contain decimals) |
| `longitude` | `longitude` | TEXT | Stored as TEXT (may contain decimals) |
| `number` | `number` | TEXT | |
| `postalcode` | `postalcode` | TEXT | |
| `streetname` | `streetname` | TEXT | |
| `opened` | `opened` | INTEGER | Year opened |
| `track_length` | `track_length` | INTEGER | |
| `wikipedia_slug` | `wikipedia_slug` | TEXT | |
| `wikipedia_snippet` | `wikipedia_snippet` | TEXT | |
| `slug` | `slug` | TEXT | |

## Teams Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `team_id` | `team_id` | TEXT | Primary Key |
| `official_name` | `official_name` | TEXT | |
| `popular_team` | `popular_team` | BOOLEAN | |
| `sport_type` | `sport_type` | TEXT | |
| `slug` | `slug` | TEXT | |
| `iso_country` | `iso_country` | TEXT | ISO 3 format |
| `wikipedia_slug` | `wikipedia_slug` | TEXT | |
| `wikipedia_snippet` | `wikipedia_snippet` | TEXT | |
| `venue_id` | `venue_id` | TEXT | Foreign key to venues |
| `team_slug` | `team_slug` | TEXT | Short code (e.g., "LIV") |
| `logo_filename` | `logo_filename` | TEXT | |
| `colors_svg` | `colors_svg` | TEXT | SVG XML content |

## Tournaments Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `tournament_id` | `tournament_id` | TEXT | Primary Key |
| `official_name` | `official_name` | TEXT | |
| `season` | `season` | TEXT | |
| `tournament_type` | `tournament_type` | TEXT | |
| `region` | `region` | TEXT | |
| `sport_type` | `sport_type` | TEXT | |
| `date_start` | `date_start` | TIMESTAMP WITH TIME ZONE | |
| `date_stop` | `date_stop` | TIMESTAMP WITH TIME ZONE | |
| `slug` | `slug` | TEXT | |
| `number_events` | `number_events` | INTEGER | |
| `created` | `created` | TIMESTAMP WITH TIME ZONE | From XS2 API |
| `updated` | `updated` | TIMESTAMP WITH TIME ZONE | From XS2 API |
| `image` | `image` | TEXT | Path to image in Supabase Storage (e.g., "tournaments/{tournament_id}.webp") or full URL for external images |

## Events Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `event_id` | `event_id` | TEXT | Primary Key |
| `event_name` | `event_name` | TEXT | |
| `date_start` | `date_start` | TIMESTAMP WITH TIME ZONE | |
| `date_stop` | `date_stop` | TIMESTAMP WITH TIME ZONE | |
| `event_status` | `event_status` | TEXT | cancelled, closed, notstarted, nosale, postponed, soldout |
| `tournament_id` | `tournament_id` | TEXT | Foreign key to tournaments |
| `tournament_name` | `tournament_name` | TEXT | |
| `venue_id` | `venue_id` | TEXT | Foreign key to venues |
| `venue_name` | `venue_name` | TEXT | |
| `location_id` | `location_id` | TEXT | |
| `city` | `city` | TEXT | |
| `iso_country` | `iso_country` | TEXT | ISO 3 format |
| `latitude` | `latitude` | TEXT | Stored as TEXT |
| `longitude` | `longitude` | TEXT | Stored as TEXT |
| `sport_type` | `sport_type` | TEXT | |
| `season` | `season` | TEXT | |
| `tournament_type` | `tournament_type` | TEXT | |
| `date_confirmed` | `date_confirmed` | BOOLEAN | |
| `date_start_main_event` | `date_start_main_event` | TIMESTAMP WITH TIME ZONE | |
| `date_stop_main_event` | `date_stop_main_event` | TIMESTAMP WITH TIME ZONE | |
| `hometeam_id` | `hometeam_id` | TEXT | Foreign key to teams |
| `hometeam_name` | `hometeam_name` | TEXT | |
| `visiting_id` | `visiting_id` | TEXT | Foreign key to teams |
| `visiting_name` | `visiting_name` | TEXT | |
| `created` | `created` | TIMESTAMP WITH TIME ZONE | From XS2 API |
| `updated` | `updated` | TIMESTAMP WITH TIME ZONE | From XS2 API |
| `event_description` | `event_description` | TEXT | |
| `min_ticket_price_eur` | `min_ticket_price_eur` | NUMERIC(10,2) | Price in EUR |
| `max_ticket_price_eur` | `max_ticket_price_eur` | NUMERIC(10,2) | Price in EUR |
| `slug` | `slug` | TEXT | |
| `number_of_tickets` | `number_of_tickets` | INTEGER | |
| `sales_periods` | `sales_periods` | JSONB | Array of objects: `[{"label": "...", "date_start": "...", "date_stop": "..."}]` |
| `is_popular` | `is_popular` | BOOLEAN | |
| `image` | `image` | TEXT | Path to image in Supabase Storage (e.g., "events/{event_id}.webp") or full URL |

## Categories Table

| XS2 API Field | Database Column | Type | Notes |
|--------------|----------------|------|-------|
| `category_id` | `category_id` | TEXT | Primary Key |
| `category_name` | `category_name` | TEXT | |
| `venue_id` | `venue_id` | TEXT | Foreign key to venues |
| `sport_type` | `sport_type` | TEXT | |
| `venue_name` | `venue_name` | TEXT | |
| `created` | `created` | TIMESTAMP WITH TIME ZONE | From XS2 API |
| `on_svg` | `on_svg` | BOOLEAN | Whether category appears on SVG map |
| `description` | `description` | JSONB | Multi-language object: `{"nl_NL": "...", "en_GB": "...", ...}` |
| `options` | `options` | JSONB | Options object: `{"videowall": true, "covered_seat": false, ...}` |
| `category_type` | `category_type` | TEXT | e.g., "grandstand" |
| `ticket_delivery_days` | `ticket_delivery_days` | INTEGER | |
| `party_size_together` | `party_size_together` | INTEGER | |
| `distribution_channel` | `distribution_channel` | TEXT | |
| `highlight_type` | `highlight_type` | TEXT | e.g., "xs2event_choice" |
| `files` | `files` | JSONB | Array of objects: `[{"category_id": "...", "information_filename": "..."}]` |
| `sports_enabled` | `sports_enabled` | TEXT[] | PostgreSQL array of strings |
| `sports_disabled` | `sports_disabled` | TEXT[] | PostgreSQL array of strings |

## JSONB Field Structures

### events.sales_periods
```json
[
  {
    "label": "Early Bird",
    "date_start": "2024-06-01T00:00:00",
    "date_stop": "2024-06-30T23:59:59"
  }
]
```

### categories.description
```json
{
  "nl_NL": "Dutch description...",
  "en_GB": "English description...",
  "de_DE": "German description...",
  // ... other languages
}
```

### categories.options
```json
{
  "videowall": true,
  "covered_seat": false,
  "numbered_seat": true,
  "package_rate": false,
  "open_hours_before_match": 2,
  "open_during_half_time": true,
  "open_hours_after_match": 1
}
```

### categories.files
```json
[
  {
    "category_id": "7df2fbc7f06e4985be92fb263b1f9c63_ctg",
    "information_filename": "info.pdf"
  }
]
```

## Indexes

All tables include indexes for:
- Primary keys
- Foreign key relationships
- Common query fields (sport_type, city, country, etc.)
- JSONB fields (GIN indexes for efficient JSON queries)
- Array fields (GIN indexes for array operations)

## Automatic Fields

All tables automatically include:
- `created_at` - Set on insert (NOW())
- `updated_at` - Automatically updated via trigger function

These are in addition to any `created`/`updated` fields that come from the XS2 API.

