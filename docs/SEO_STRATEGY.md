# SEO Strategy for Apex Tickets

## Current Structure
- `/events` - Generic events listing with filters
- `/events/[eventId]` - Individual event pages
- Sport links point to `/events?sport_type=...` (not SEO-friendly)

## Recommended SEO Structure

### 1. Sport Landing Pages (Priority 1)
**URLs:**
- `/formula-1` - Formula 1 tickets landing page
- `/tennis` - Tennis tickets landing page  
- `/football` - Football tickets landing page
- `/motogp` - MotoGP tickets landing page

**Benefits:**
- Target high-value keywords ("Formula 1 tickets", "Tennis tickets")
- Clean, keyword-rich URLs
- Better user experience
- Room for unique content per sport
- Better internal linking structure

### 2. Tournament/Competition Pages (Priority 2)
**URLs:**
- `/formula-1/f1-grand-prix` - Specific tournament pages
- `/tennis/wimbledon` - Tournament-specific pages

**Benefits:**
- Target long-tail keywords
- Better organization
- More landing pages = more SEO opportunities

### 3. Location-Based Pages (Priority 3)
**URLs:**
- `/formula-1/uk` - Location-specific pages
- `/tennis/london` - City-specific pages

**Benefits:**
- Local SEO targeting
- "Formula 1 tickets UK" type searches
- Better for local customers

## Implementation Plan

### Phase 1: Sport Landing Pages
1. Create `/formula-1/page.tsx`, `/tennis/page.tsx`, etc.
2. Each page includes:
   - SEO meta tags (title, description, OG tags)
   - Hero section with sport description
   - Upcoming events carousel
   - Popular tournaments section
   - Featured venues/locations
   - Schema markup (SportsEvent, Organization)
   - Breadcrumbs
   - Internal links to events

### Phase 2: Dynamic Content
- Fetch upcoming events for the sport
- Display popular tournaments
- Show featured venues
- Include event counts

### Phase 3: Content & Optimization
- Add unique descriptions for each sport
- Include FAQ sections
- Add related articles/blog links
- Optimize images with alt text
- Add structured data (JSON-LD)

## SEO Best Practices

### Meta Tags
```typescript
{
  title: "Formula 1 Tickets | Buy F1 Race Tickets Online | Apex Tickets",
  description: "Buy official Formula 1 tickets for all Grand Prix races. Secure your F1 race tickets with Apex Tickets. Best prices guaranteed.",
  keywords: "formula 1 tickets, f1 tickets, grand prix tickets"
}
```

### Schema Markup
- SportsEvent schema for events
- Organization schema for Apex Tickets
- BreadcrumbList schema
- FAQPage schema (if adding FAQs)

### Internal Linking
- Link from homepage to sport pages
- Link from sport pages to events
- Link from events back to sport pages
- Cross-link related sports

### URL Structure
- Use hyphens: `/formula-1` (not `/formula1`)
- Keep URLs short and descriptive
- Use lowercase
- Avoid query parameters for main pages

## Content Strategy

### Each Sport Page Should Include:
1. **Hero Section**
   - Sport name and tagline
   - Brief description
   - CTA button

2. **Upcoming Events**
   - Carousel/grid of next 6-12 events
   - Links to event detail pages
   - Date and location info

3. **Popular Tournaments**
   - Featured tournaments/competitions
   - Links to tournament pages or filtered events

4. **Featured Venues**
   - Popular venues for the sport
   - Location info
   - Links to venue-filtered events

5. **Why Choose Us Section**
   - Trust indicators
   - Guarantee messaging
   - Customer testimonials

6. **FAQ Section** (optional)
   - Common questions about tickets
   - Schema markup for FAQPage

## Tracking & Analytics

### Key Metrics:
- Organic traffic to sport pages
- Conversion rate from sport pages
- Keyword rankings
- Click-through rates
- Bounce rate

### Tools:
- Google Search Console
- Google Analytics 4
- Schema markup validator
- PageSpeed Insights

## Next Steps

1. ✅ Create sport landing page template
2. ✅ Implement for Formula 1, Tennis, Football, MotoGP
3. ✅ Add SEO meta tags
4. ✅ Add schema markup
5. ✅ Update navigation links
6. ✅ Add breadcrumbs
7. ✅ Test and optimize

