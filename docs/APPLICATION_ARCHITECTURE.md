# Application Architecture Overview

## System Overview

Your ticket website is a **Next.js 16** application that acts as a **middleware layer** between:
1. **XS2 API** (external ticket inventory provider)
2. **Supabase** (PostgreSQL database + storage)
3. **Stripe** (payment processing)
4. **End users** (browsers)

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        XS2 API (External)                       │
│  - Events, Tournaments, Sports, Teams, Venues, Tickets          │
│  - Real-time inventory and pricing                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Daily Sync (Edge Function)
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tables:                                                  │  │
│  │ - events (event_id, event_name, date_start, etc.)       │  │
│  │ - tournaments (tournament_id, official_name, etc.)      │  │
│  │ - sports (sport_id, image)                               │  │
│  │ - teams, venues, countries, cities, categories          │  │
│  │ - orders (customer_email, stripe_payment_intent_id)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Storage Bucket: "images"                                 │  │
│  │ - events/{event_id}.webp                                 │  │
│  │ - tournaments/{tournament_id}.webp                       │  │
│  │ - sports/{sport_id}.webp                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Next.js API Routes (/api/xs2/*)
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                    Next.js Application                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Server Components / API Routes                           │  │
│  │ - Query Supabase directly                                │  │
│  │ - Cache with unstable_cache (1 hour)                     │  │
│  │ - Return XS2-compatible JSON format                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Client Components                                        │  │
│  │ - Fetch from /api/xs2/* routes                           │  │
│  │ - Client-side filtering, sorting, pagination              │  │
│  │ - Zustand for cart state                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ User Actions
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                      Browser (User)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Components & Their Roles

### 1. **Data Synchronization Layer**

**Location:** `supabase/functions/sync-xs2/index.ts`

**Purpose:** Syncs XS2 API data to Supabase PostgreSQL

**How it works:**
- Runs as Supabase Edge Function
- Triggered by:
  - Daily cron job (2 AM UTC)
  - Manual HTTP call
  - Database webhook
- Fetches all pages from XS2 API
- Batch upserts to Supabase (500 records at a time)
- Syncs tables in dependency order:
  1. Sports → Countries → Cities → Venues → Teams
  2. Tournaments → Events → Categories

**Tables synced:**
- `sports`, `countries`, `cities`, `venues`, `teams`
- `tournaments`, `events`, `categories`

---

### 2. **API Layer (Next.js API Routes)**

**Location:** `src/app/api/xs2/*/route.ts`

**Purpose:** Provides XS2-compatible API endpoints that query Supabase

**Key Routes:**
- `/api/xs2/events` - Events with filtering, pagination
- `/api/xs2/tournaments` - Tournaments by sport/region
- `/api/xs2/sports` - All sports
- `/api/xs2/teams`, `/api/xs2/venues`, `/api/xs2/countries`
- `/api/xs2/tickets` - Ticket availability (queries XS2 directly)
- `/api/xs2/categories` - Seating categories

**Caching Strategy:**
- List requests: `unstable_cache` with 1-hour revalidation
- Single event requests: `cache: "no-store"` (always fresh)
- Reduces Supabase load, improves performance

**Data Transformation:**
- Maps Supabase columns to XS2 API field names
- Adds pagination metadata
- Returns XS2-compatible JSON format

---

### 3. **Image Management System**

**Location:** `src/lib/images.ts`, `src/lib/storage.ts`

**Purpose:** Handles image fallback chain and Supabase Storage URLs

**Image Priority (for events):**
1. Event `image` column (Supabase Storage path or full URL)
2. API-provided `image_url` or `photo_url` (legacy)
3. Tournament `image` column
4. Sport `image` column
5. Local file `/images/sports/{sport}.webp`
6. Unsplash fallback (commented out)

**Storage Structure:**
```
Supabase Storage Bucket: "images"
├── events/{event_id}.webp
├── tournaments/{tournament_id}.webp
└── sports/{sport_id}.webp
```

**URL Generation:**
- Storage paths converted to public URLs: `${SUPABASE_URL}/storage/v1/object/public/images/{path}`
- Full URLs passed through as-is

---

### 4. **Client-Side Data Fetching**

**Location:** `src/hooks/use-events-api.ts`, `src/components/*`

**Pattern:**
- Client components fetch from `/api/xs2/*` routes
- Client-side filtering, sorting, pagination
- Debounced search (300ms)
- In-memory caching (5 minutes)

**Key Hooks:**
- `useEventsAPI()` - Fetches events with pagination
- `useFilters()` - Manages filter state
- `useDebounce()` - Debounces filter changes

**Components:**
- `EventsExplorerEnhanced` - Main events listing with filters
- `HeroCarousel` - Featured events carousel
- `PopularTournaments` - Curated tournament cards
- `UpcomingEventsSlider` - Upcoming events carousel

---

### 5. **State Management**

**Location:** `src/store/cart-store.ts`

**Technology:** Zustand (lightweight state management)

**Cart State:**
```typescript
{
  items: CartItem[],
  addItem: (item) => void,
  removeItem: (id) => void,
  clearCart: () => void,
  getTotalPrice: () => number
}
```

**Cart Item Structure:**
- `xs2_ticket_id` - References XS2 ticket
- `xs2_event_id` - References XS2 event
- `price`, `quantity`, `event_name`, etc.

---

### 6. **Payment Flow**

**Location:** `src/app/checkout/page.tsx`, `src/app/api/stripe/*`

**Flow:**
1. User adds tickets to cart (Zustand store)
2. User goes to `/checkout`
3. User enters name/email
4. POST `/api/stripe/checkout`:
   - Validates stock with XS2 API (`validateStock()`)
   - Creates Stripe PaymentIntent
   - Creates pending order in Supabase `orders` table
   - Returns `client_secret`
5. Stripe webhook (`/api/stripe/webhook`):
   - Updates order status on payment success/failure
   - Handles payment confirmation

**Order Storage:**
- Stored in Supabase `orders` table
- Links to Stripe PaymentIntent
- Contains XS2 ticket IDs for fulfillment

---

### 7. **Routing Structure**

```
/ (homepage)
├── HeroCarousel (featured events)
├── PopularTournaments (curated tournaments)
├── UpcomingEventsSlider (upcoming events)
├── Sport Categories (browse by sport)
└── Testimonials (hardcoded)

/events (all events)
└── EventsExplorerEnhanced (filters, search, pagination)

/events/[eventId] (event detail)
├── EventDetailContent
├── TicketSelector
└── VenueMap

/formula-1, /football, /motogp, /tennis (sport pages)
└── SportEventsLayout (filtered by sport)

/cart (shopping cart)
└── Cart items from Zustand store

/checkout (payment)
└── Stripe checkout form

/order/[orderId] (order confirmation)
└── Order details from Supabase
```

---

## Data Relationships

```
sports (1) ──< (many) tournaments
tournaments (1) ──< (many) events
events (1) ──< (many) categories
categories (1) ──< (many) tickets (XS2 API)
venues (1) ──< (many) events
teams (1) ──< (many) events (as hometeam or visiting)
countries (1) ──< (many) cities
cities (1) ──< (many) venues
```

---

## Key Design Decisions

### 1. **Why Supabase as Middle Layer?**
- **Performance:** Cached queries faster than direct XS2 API calls
- **Reliability:** Reduces dependency on XS2 API availability
- **Flexibility:** Can add custom fields, relationships, indexes
- **Image Storage:** Centralized image management

### 2. **Why Client-Side Filtering?**
- **Speed:** No round-trip for every filter change
- **UX:** Instant feedback, debounced API calls
- **Flexibility:** Complex multi-filter combinations

### 3. **Why XS2-Compatible API Format?**
- **Consistency:** Same data structure throughout app
- **Future-proof:** Easy to switch data source
- **Developer Experience:** Familiar API shape

### 4. **Why Zustand for Cart?**
- **Lightweight:** No Redux boilerplate
- **Simple:** Perfect for cart state
- **Persistent:** Can add localStorage persistence later

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# XS2 API
XS2_API_KEY=xxx
XS2_API_BASE=https://api.xs2event.com/v1

# Stripe
STRIPE_SECRET_KEY=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
```

---

## Performance Optimizations

1. **API Caching:**
   - `unstable_cache` for list requests (1 hour)
   - Reduces Supabase query load

2. **Client-Side Caching:**
   - 5-minute in-memory cache in `useEventsAPI`
   - Reduces redundant API calls

3. **Parallel Fetching:**
   - `PopularTournaments` fetches all leagues in parallel
   - `HeroCarousel` fetches multiple sports in parallel

4. **Optimized Payloads:**
   - Events API selects only needed fields
   - Smaller JSON responses = faster parsing

5. **Image Optimization:**
   - Next.js Image component with `remotePatterns`
   - Lazy loading, responsive sizes
   - Supabase Storage CDN

---

## Current Limitations & Future Considerations

### Hardcoded Content (Potential Sanity CMS Integration)
- **Testimonials:** Hardcoded array in `testimonials-section.tsx`
- **Value Props:** Hardcoded in `page.tsx`
- **Section Headers:** Hardcoded titles/subtitles
- **Sport Categories:** Hardcoded descriptions

### Manual Curation
- **Hero Carousel:** Automatically selects popular events
- **Popular Tournaments:** Automatically matches by name
- No manual override for featured content

### Image Management
- Manual upload via scripts (`sync-event-images.ts`)
- No admin UI for image management
- Images stored in Supabase Storage (good for now)

---

## Where Sanity CMS Would Fit

Sanity would manage **marketing/editorial content** that's currently hardcoded:

1. **Testimonials** - Replace hardcoded array
2. **Value Propositions** - Replace hardcoded cards
3. **Section Headers** - Dynamic titles/subtitles
4. **Hero Carousel Curation** - Manual event selection
5. **Popular Tournaments** - Manual tournament selection
6. **SEO Content** - Meta descriptions, page titles
7. **Blog/Articles** - Future content marketing

**What Stays in Supabase:**
- All transactional data (events, tickets, orders)
- Real-time inventory
- User data
- Image storage (or move to Sanity Assets)

---

## Summary

Your application is a **well-architected Next.js app** that:
- ✅ Syncs XS2 data to Supabase daily
- ✅ Provides fast, cached API endpoints
- ✅ Handles complex filtering and search
- ✅ Manages cart and checkout flow
- ✅ Integrates Stripe payments
- ✅ Optimizes images and performance

**Main opportunity:** Replace hardcoded marketing content with Sanity CMS for non-technical content management.

