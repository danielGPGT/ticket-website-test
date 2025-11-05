# XS2 API Review

## Overview
This document reviews the XS2 API integration, endpoints, and data structures used in the ticket website.

**Base URL:** `https://api.xs2event.com/v1`  
**Authentication:** `X-Api-Key` header

---

## Endpoints Summary

| Endpoint | Route | Method | Description |
|----------|-------|--------|-------------|
| Events | `/api/xs2/events` | GET | Fetch events (single or list) |
| Tickets | `/api/xs2/tickets` | GET | Fetch tickets for events |
| Categories | `/api/xs2/categories` | GET | Fetch ticket categories for an event |
| Sports | `/api/xs2/sports` | GET | Fetch available sports |
| Tournaments | `/api/xs2/tournaments` | GET | Fetch tournaments |
| Countries | `/api/xs2/countries` | GET | Fetch countries |
| Teams | `/api/xs2/teams` | GET | Fetch teams |
| Venues | `/api/xs2/venues` | GET | Fetch venues |

---

## 1. Events Endpoint (`/api/xs2/events`)

### Base URL
- **List:** `https://api.xs2event.com/v1/events?{query_params}`
- **Single:** `https://api.xs2event.com/v1/events/{eventId}`

### Query Parameters
- `id` or `event_id` - Single event ID (when used, returns single event)
- `sport_type` - Filter by sport (e.g., `formula1`, `football`, `tennis`, `motogp`)
- `tournament_id` - Filter by tournament
- `team_id` - Filter by team (converted from `team` parameter)
- `country` - Filter by country (ISO 3 format)
- `date_stop` - Date filter (e.g., `ge:2024-01-01` for "greater than or equal")
- `event_name` - Search by event name
- `is_popular` - Filter popular events (`true`/`false`)
- `page` - Page number (default: 1)
- `page_size` - Results per page (default: 50)
- `origin` - Internal parameter (not sent to XS2 API, removed before request)

### Response Structure Variations
The API response structure is **inconsistent**. The code handles multiple possible response formats:

```typescript
// Option 1: Array directly
data = [event1, event2, ...]

// Option 2: Object with results
data = { results: [event1, event2, ...] }

// Option 3: Object with items
data = { items: [event1, event2, ...] }

// Option 4: Object with events
data = { events: [event1, event2, ...] }
```

**Current handling:** `data.events ?? data.results ?? data.items ?? []`

### Single Event Response
When fetching by `event_id`:
- Returns single event object (not in array)
- Code normalizes to: `{ results: [event] }`

### Event Object Fields (Observed in Code)

#### Identification
- `id` or `event_id` - Event identifier
- `name` or `event_name` or `official_name` - Event name

#### Location & Venue
- `venue_name` or `venue` - Venue name
- `venue_id` or `venueId` - Venue identifier
- `city` - City name
- `iso_country` or `country` - Country code (ISO 3 format)

#### Dates
- `date_start` or `date_start_main_event` - Start date
- `date_stop` or `date_stop_main_event` - End date

#### Sport & Tournament
- `sport_type` - Sport type (e.g., `formula1`, `football`, `tennis`, `motogp`)
- `tournament_name` - Tournament name
- `tournamentId` - Tournament ID

#### Pricing & Availability
- `min_ticket_price_eur` or `min_price_eur` - Minimum ticket price (may be in cents if >1000)
- `number_of_tickets` - Available ticket count

#### Status
- `event_status` - Status values: `cancelled`, `closed`, `notstarted`, `nosale`, `postponed`, `soldout`

#### Popularity
- `is_popular` or `popular` - Boolean flag for popular events

### Pagination
Response may include:
```typescript
{
  pagination: {
    next_page: string | null,
    page_number: number,
    // ... other pagination fields
  }
}
```

### Caching
- **Duration:** 24 hours (86400 seconds)
- **Cache Key:** Based on sorted query parameters
- **Tag:** `events`

---

## 2. Tickets Endpoint (`/api/xs2/tickets`)

### Base URL
`https://api.xs2event.com/v1/tickets?{query_params}`

### Query Parameters
- `event_id` - Filter by event ID
- `id` - Comma-separated ticket IDs (for validation)
- `ticket_status` - Filter by status (e.g., `available`)
- `stock` - Stock filter (e.g., `gt:0` for "greater than 0")
- `page` - Page number
- `page_size` - Results per page (default: 200)

### Response Structure Variations
Similar inconsistency as events:

```typescript
// Option 1: Object with tickets
data = { tickets: [ticket1, ticket2, ...] }

// Option 2: Object with results
data = { results: [ticket1, ticket2, ...] }

// Option 3: Object with items
data = { items: [ticket1, ticket2, ...] }
```

**Current handling:** `data.tickets ?? data.results ?? data.items ?? []`

### Ticket Object Fields (Defined Type)

```typescript
type Ticket = {
  id: string;                    // Ticket ID
  event_id: string;              // Associated event ID
  category_id: string;           // Category identifier
  sub_category: string;          // e.g., "fri_regular", "weekend_regular"
  price: number;                // Price (may be in cents)
  stock: number;                 // Available stock
  status?: string;               // Ticket status
  ticket_status?: string;        // Alternative status field
  quantity?: number;             // Alternative stock field
}
```

### Stock Validation
The `validateStock()` function checks:
1. Tickets with `ticket_status: "available"`
2. Tickets with `stock > 0` (or `quantity > 0`)
3. All requested ticket IDs must be available

---

## 3. Categories Endpoint (`/api/xs2/categories`)

### Base URL
`https://api.xs2event.com/v1/categories?event_id={eventId}`

### Query Parameters
- `event_id` - **Required** - Event ID to fetch categories for

### Response Structure Variations
```typescript
// Option 1: Object with categories
data = { categories: [category1, category2, ...] }

// Option 2: Object with results
data = { results: [category1, category2, ...] }

// Option 3: Object with items
data = { items: [category1, category2, ...] }
```

**Current handling:** `data.categories ?? data.results ?? data.items ?? []`

### Category Object Fields (Observed)
- `id` or `category_id` - Category identifier
- `name` - Category name
- `highlight_type` - May include `"xs2event_choice"` for featured categories
- Other fields used in ticket grouping and display

---

## 4. Sports Endpoint (`/api/xs2/sports`)

### Base URL
`https://api.xs2event.com/v1/sports?{query_params}`

### Query Parameters
- `page` - Page number
- `page_size` - Results per page

### Response Structure Variations
```typescript
// Option 1: Object with sports
data = { sports: [sport1, sport2, ...] }

// Option 2: Object with results
data = { results: [sport1, sport2, ...] }

// Option 3: Object with items
data = { items: [sport1, sport2, ...] }
```

**Current handling:** `data.sports ?? data.results ?? data.items ?? []`

### Error Handling
Returns fallback structure on error:
```typescript
{
  error: "Failed to fetch sports",
  status: number,
  details: string,
  sports: [],
  results: [],
  items: []
}
```

---

## 5. Tournaments Endpoint (`/api/xs2/tournaments`)

### Base URL
`https://api.xs2event.com/v1/tournaments?{query_params}`

### Query Parameters
- `sport_type` - Filter by sport
- `region` - Filter by region/country
- `popular` - Filter popular tournaments (`true`/`false`)
- `page` - Page number
- `page_size` - Results per page

### Response Structure Variations
```typescript
// Option 1: Object with tournaments
data = { tournaments: [tournament1, tournament2, ...] }

// Option 2: Object with results
data = { results: [tournament1, tournament2, ...] }
```

**Current handling:** `data.tournaments ?? data.results ?? []`

---

## 6. Countries Endpoint (`/api/xs2/countries`)

### Base URL
`https://api.xs2event.com/v1/countries?{query_params}`

### Query Parameters
- `page` - Page number
- `page_size` - Results per page (default: 200)

### Response Structure
Similar variation pattern as other endpoints.

---

## 7. Teams Endpoint (`/api/xs2/teams`)

### Base URL
`https://api.xs2event.com/v1/teams?{query_params}`

### Query Parameters
- `sport_type` - Filter by sport (e.g., `soccer`)
- `iso_country` - Filter by country code
- `popular` - Filter popular teams (`true`/`false`)
- `page` - Page number
- `page_size` - Results per page

---

## 8. Venues Endpoint (`/api/xs2/venues`)

### Base URL
`https://api.xs2event.com/v1/venues?{query_params}`

### Query Parameters
- Standard pagination parameters

### Venue Assets
- Venue SVG maps available at: `https://cdn.xs2event.com/venues/{venueId}.svg`

---

## Data Structure Issues & Inconsistencies

### 1. Response Format Inconsistency
**Problem:** The API returns data in different formats:
- Sometimes `results`
- Sometimes `items`
- Sometimes `events`, `tickets`, `categories`, `sports`, `tournaments`
- Sometimes direct array

**Impact:** Code must handle multiple fallback patterns throughout the codebase.

**Recommendation:** 
- Document the actual standard response format from XS2
- Create a unified response normalizer utility
- Consider TypeScript types for each endpoint response

### 2. Field Name Variations
**Problem:** Many fields have multiple possible names:
- `id` vs `event_id`
- `name` vs `event_name` vs `official_name`
- `venue_name` vs `venue`
- `date_start` vs `date_start_main_event`
- `ticket_status` vs `status`
- `stock` vs `quantity`

**Impact:** Code uses fallback chains like:
```typescript
const eventName = event.name ?? event.event_name ?? event.official_name ?? "Event";
```

**Recommendation:**
- Standardize field access with helper functions
- Document which fields are guaranteed vs optional
- Consider creating TypeScript interfaces that union all possible field names

### 3. Price Format Inconsistency
**Problem:** Prices may be in cents or euros:
```typescript
// Code handles this:
const minPrice = typeof minPriceRaw === "number"
  ? (minPriceRaw > 1000 ? minPriceRaw / 100 : minPriceRaw)
  : undefined;
```

**Recommendation:**
- Clarify with XS2 whether prices are always in cents or euros
- Document the expected format
- Create a price normalization utility

### 4. Date Filter Limitations
**Problem:** Code notes that `date_stop` may not work with `tournament_id` alone:
```typescript
// Note: XS2 API might not accept date_stop with tournament_id alone, so only add for sport_type
```

**Recommendation:**
- Document all parameter combinations that work/don't work
- Add validation for invalid parameter combinations

### 5. Pagination Inconsistency
**Problem:** Pagination handling varies:
- Some endpoints use `next_page` URL
- Some use `page_number`
- Code handles both patterns

**Recommendation:**
- Document pagination structure for each endpoint
- Create a unified pagination handler

---

## Query Parameter Observations

### Date Filters
- Format: `ge:YYYY-MM-DD` (greater than or equal)
- Used for filtering future events

### Country Codes
- API expects **ISO 3 format** (e.g., `USA`, `GBR`)
- Code includes normalization from ISO 2 to ISO 3

### Status Values
- **Event status:** `cancelled`, `closed`, `notstarted`, `nosale`, `postponed`, `soldout`
- **Ticket status:** `available` (and possibly others)

### Sport Types
Observed values:
- `formula1` or `formula-1`
- `football` or `soccer`
- `tennis`
- `motogp`

---

## Recommendations

### Short Term
1. **Create Type Definitions**
   - Define TypeScript interfaces for each endpoint response
   - Document optional vs required fields
   - Include all known field name variations

2. **Response Normalization Utility**
   ```typescript
   function normalizeResponse<T>(data: any, key?: string): T[] {
     if (Array.isArray(data)) return data;
     if (key && data[key]) return data[key];
     return data.results ?? data.items ?? [];
   }
   ```

3. **Field Access Helpers**
   ```typescript
   function getEventName(event: any): string {
     return event.name ?? event.event_name ?? event.official_name ?? "Event";
   }
   ```

### Medium Term
1. **Documentation**
   - Create API documentation file
   - Document all known parameter combinations
   - Document response structures for each endpoint

2. **Error Handling**
   - Standardize error response format
   - Add retry logic for transient failures
   - Better error messages

3. **Testing**
   - Create mock responses for each endpoint
   - Test all response format variations
   - Test edge cases (empty responses, errors, etc.)

### Long Term
1. **API Wrapper Library**
   - Create a dedicated XS2 API client library
   - Type-safe methods for each endpoint
   - Built-in response normalization
   - Automatic retry and error handling

2. **Response Caching Strategy**
   - Review current 24-hour cache for events
   - Consider different cache durations for different endpoints
   - Implement cache invalidation strategy

---

## Current Implementation Strengths

1. ✅ **Consistent Error Handling** - All endpoints have try/catch blocks
2. ✅ **Fallback Patterns** - Code handles multiple response formats
3. ✅ **Parameter Normalization** - Converts `team` → `team_id`, `page_number` → `page`
4. ✅ **Caching** - Events endpoint uses Next.js caching effectively
5. ✅ **Stock Validation** - Dedicated function for ticket availability checks

---

## Files Reviewed

- `src/lib/xs2-api.ts` - Core API utilities
- `src/app/api/xs2/events/route.ts` - Events endpoint
- `src/app/api/xs2/tickets/route.ts` - Tickets endpoint
- `src/app/api/xs2/categories/route.ts` - Categories endpoint
- `src/app/api/xs2/sports/route.ts` - Sports endpoint
- `src/app/api/xs2/tournaments/route.ts` - Tournaments endpoint
- `src/app/api/xs2/countries/route.ts` - Countries endpoint
- `src/app/api/xs2/teams/route.ts` - Teams endpoint
- `src/app/api/xs2/venues/route.ts` - Venues endpoint

---

## Summary

The XS2 API integration is functional but has several inconsistencies that require defensive coding patterns throughout the codebase. The main issues are:

1. **Inconsistent response formats** across endpoints
2. **Multiple field name variations** for the same data
3. **Unclear price format** (cents vs euros)
4. **Parameter compatibility** issues (e.g., date_stop with tournament_id)

The codebase handles these issues well with fallback patterns, but this increases complexity and maintenance burden. Standardizing the API responses or creating a robust wrapper library would significantly improve code quality and maintainability.

