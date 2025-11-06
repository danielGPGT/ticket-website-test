# How Sanity CMS Would Work on Event Detail Page

## Current State (Without Sanity)

### What's Currently Auto-Generated

**Location:** `src/components/event-detail-content.tsx` (lines 308-376)

The event detail page currently has:

1. **Auto-Generated Promotional Text** (lines 319-372)
   - Two paragraphs built from event data
   - Template-based, generic language
   - Example output:
     ```
     "Experience the excitement of Formula 1 at the iconic Silverstone Circuit 
     in Silverstone, United Kingdom. Monaco Grand Prix 2026 promises to deliver 
     unforgettable moments for fans of Formula 1.
     
     Tickets for Monaco Grand Prix 2026 are now available! Secure your place 
     today from just £450 and be part of this incredible sporting spectacle 
     at Silverstone Circuit."
     ```

2. **Auto-Generated SEO Metadata** (`src/app/events/[eventId]/page.tsx`, lines 80-114)
   - Title: `"{EventName} Tickets | Buy Online | Apex Tickets"`
   - Description: `"Buy tickets for {EventName} at {Venue}. Official tickets..."`
   - Keywords: Auto-generated from event data

3. **No Editorial Content Sections**
   - No "About this event" section
   - No "What to expect" section
   - No travel tips or venue highlights
   - No custom call-to-action text
   - No event-specific images/gallery

---

## With Sanity CMS

### What You Could Add

**Sanity Studio Interface:**
```
Event Content Editor
├── Event Reference (link to Supabase event_id)
├── Custom Title Override (optional)
├── Custom Description (rich text, replaces auto-generated)
├── SEO Settings
│   ├── Meta Title
│   ├── Meta Description
│   └── Open Graph Image
├── Editorial Sections
│   ├── About This Event (rich text)
│   ├── What to Expect (rich text)
│   ├── Travel Tips (rich text)
│   └── Venue Highlights (rich text)
├── Custom CTA Text
└── Related Events (manual selection)
```

### How It Would Work Technically

**1. Sanity Schema:**
```javascript
// schemas/eventContent.js
export default {
  name: 'eventContent',
  title: 'Event Content',
  type: 'document',
  fields: [
    {
      name: 'eventId',
      title: 'Event ID (from Supabase)',
      type: 'string',
      description: 'The event_id from your Supabase events table',
      validation: Rule => Rule.required()
    },
    {
      name: 'customTitle',
      title: 'Custom Page Title (optional)',
      type: 'string',
      description: 'Override auto-generated title. Leave empty to use default.'
    },
    {
      name: 'customDescription',
      title: 'Custom Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Rich text description. Replaces auto-generated promotional text.'
    },
    {
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        { name: 'metaTitle', type: 'string' },
        { name: 'metaDescription', type: 'text' },
        { name: 'ogImage', type: 'image' }
      ]
    },
    {
      name: 'aboutSection',
      title: 'About This Event',
      type: 'array',
      of: [{ type: 'block' }]
    },
    {
      name: 'whatToExpect',
      title: 'What to Expect',
      type: 'array',
      of: [{ type: 'block' }]
    },
    {
      name: 'travelTips',
      title: 'Travel Tips',
      type: 'array',
      of: [{ type: 'block' }]
    },
    {
      name: 'venueHighlights',
      title: 'Venue Highlights',
      type: 'array',
      of: [{ type: 'block' }]
    },
    {
      name: 'customCtaText',
      title: 'Custom CTA Button Text',
      type: 'string',
      description: 'Override default "Book Now" text'
    },
    {
      name: 'relatedEvents',
      title: 'Related Events',
      type: 'array',
      of: [{ 
        type: 'object',
        fields: [
          { name: 'eventId', type: 'string' },
          { name: 'title', type: 'string' }
        ]
      }]
    }
  ],
  preview: {
    select: {
      eventId: 'eventId',
      customTitle: 'customTitle'
    },
    prepare({ eventId, customTitle }) {
      return {
        title: customTitle || `Event: ${eventId}`
      }
    }
  }
}
```

**2. Updated Event Detail Page:**

```typescript
// src/app/events/[eventId]/page.tsx
import { sanityClient } from '@/lib/sanity';
import { groq } from 'next-sanity';

export default async function EventDetail({ params }) {
  const { eventId } = await params;
  
  // Fetch event data from Supabase (existing)
  const [event, tickets, categories] = await Promise.all([
    fetchEvent(eventId),
    fetchTickets(eventId),
    fetchCategories(eventId),
  ]);

  // NEW: Fetch editorial content from Sanity
  const eventContent = await sanityClient.fetch(
    groq`*[_type == "eventContent" && eventId == $eventId][0]`,
    { eventId }
  );

  return (
    <EventDetailContent 
      event={event} 
      tickets={tickets} 
      categories={categories}
      eventContent={eventContent} // NEW prop
    />
  );
}
```

**3. Updated Component:**

```typescript
// src/components/event-detail-content.tsx
type EventDetailContentProps = {
  event: any;
  tickets: any[];
  categories: any[];
  eventContent?: any; // NEW: Sanity content
  // ... other props
};

export function EventDetailContent({ event, eventContent, ... }: EventDetailContentProps) {
  // Use Sanity content if available, fallback to auto-generated
  const pageTitle = eventContent?.customTitle 
    || `Book ${eventName} ${year} Tickets`;
  
  const description = eventContent?.customDescription 
    ? portableTextToHtml(eventContent.customDescription) // Convert Sanity rich text
    : generateAutoDescription(event); // Current auto-generation

  return (
    <div>
      <SectionHeader
        title={pageTitle}
        subtitle={description}
      />
      
      {/* NEW: Editorial sections if available */}
      {eventContent?.aboutSection && (
        <section className="my-8">
          <h2>About This Event</h2>
          <PortableText value={eventContent.aboutSection} />
        </section>
      )}
      
      {eventContent?.whatToExpect && (
        <section className="my-8">
          <h2>What to Expect</h2>
          <PortableText value={eventContent.whatToExpect} />
        </section>
      )}
      
      {/* Existing tickets section */}
      <div id="tickets">
        {/* ... existing ticket code ... */}
      </div>
      
      {/* NEW: Related events if available */}
      {eventContent?.relatedEvents && (
        <section className="my-8">
          <h2>You Might Also Like</h2>
          {/* Render related events */}
        </section>
      )}
    </div>
  );
}
```

---

## Benefits for Event Detail Page

### 1. **Manual Curation for High-Value Events**

**Current:** All events get the same generic template text

**With Sanity:** 
- Monaco Grand Prix gets custom, compelling copy
- Wimbledon final gets unique description
- Champions League final gets special treatment
- Regular events still use auto-generated text (fallback)

### 2. **SEO Optimization**

**Current:** Auto-generated meta descriptions (generic)

**With Sanity:**
- Custom meta titles for important events
- Keyword-optimized descriptions
- Custom Open Graph images
- Better search rankings for featured events

### 3. **Rich Editorial Content**

**Current:** Just tickets and venue map

**With Sanity:**
- "About This Event" section with rich formatting
- "What to Expect" section (schedule, highlights)
- Travel tips (parking, public transport, hotels)
- Venue highlights (history, amenities)
- Related events recommendations

### 4. **A/B Testing & Personalization**

**Current:** One-size-fits-all

**With Sanity:**
- Test different descriptions
- Seasonal messaging (e.g., "Summer sale" in June)
- Regional variations (different copy for UK vs US)
- Event-specific promotions

### 5. **Content Workflow**

**Current:** Developer changes code to update text

**With Sanity:**
- Marketing team updates content directly
- No code deployments needed
- Preview before publishing
- Version history (rollback if needed)

---

## Example: Monaco Grand Prix

### Current (Auto-Generated):
```
Title: "Monaco Grand Prix 2026 Tickets | Buy Online | Apex Tickets"

Description: "Experience the excitement of Formula 1 at the iconic 
Circuit de Monaco in Monte Carlo, Monaco. Monaco Grand Prix 2026 
promises to deliver unforgettable moments for fans of Formula 1.

Tickets for Monaco Grand Prix 2026 are now available! Secure your 
place today from just £450..."
```

### With Sanity (Manual):
```
Title: "Monaco Grand Prix 2026 | F1's Crown Jewel | Apex Tickets"

Description: "Experience the glitz and glamour of Formula 1's most 
prestigious race weekend. The Monaco Grand Prix combines world-class 
racing with the stunning backdrop of the French Riviera. Watch 
Formula 1's elite drivers navigate the legendary street circuit 
through Monte Carlo's iconic landmarks.

This year's event features exclusive hospitality packages, yacht 
viewing options, and VIP access to the paddock. Book your Monaco 
experience today and be part of motorsport history."

About This Event:
"The Monaco Grand Prix is the crown jewel of Formula 1, combining 
high-speed racing with the glamour of the French Riviera. Since 1929, 
this iconic street circuit has challenged drivers with its narrow 
corners, elevation changes, and unforgiving barriers.

The 2026 edition promises to be particularly special, with new 
regulations bringing closer racing and the return of legendary 
drivers to the grid."

What to Expect:
- Practice sessions: Friday & Saturday
- Qualifying: Saturday afternoon
- Race: Sunday 2:00 PM local time
- Post-race celebrations in Monte Carlo
- Exclusive access to the paddock (VIP packages)

Travel Tips:
- Best hotels: Hotel Hermitage, Hotel de Paris
- Public transport: Train from Nice Airport (30 min)
- Parking: Limited, book in advance
- Dress code: Smart casual for hospitality areas
```

---

## Implementation Strategy

### Phase 1: Basic Integration
1. Add Sanity schema for `eventContent`
2. Update event detail page to fetch Sanity content
3. Use Sanity content if available, fallback to auto-generated
4. Start manually curating 5-10 high-value events

### Phase 2: Rich Content Sections
1. Add "About", "What to Expect", "Travel Tips" sections
2. Update component to render these sections
3. Train marketing team on Sanity Studio

### Phase 3: Advanced Features
1. Related events recommendations
2. A/B testing different descriptions
3. Seasonal/regional content variations
4. Image galleries for events

---

## Cost-Benefit Analysis

### Investment:
- **Setup time:** 2-3 days (schema, integration, testing)
- **Sanity cost:** Free tier (10K documents) or $99/month
- **Training:** 1-2 hours for marketing team

### Benefits:
- **SEO:** Better rankings for curated events
- **Conversion:** More compelling copy = more sales
- **Time saved:** No developer needed for content updates
- **Flexibility:** Test different messaging quickly
- **Scalability:** Curate important events, auto-generate rest

### ROI:
- If 10 curated events convert 5% better = significant revenue increase
- Marketing team can update content instantly (no dev bottleneck)
- Better SEO = more organic traffic

---

## Conclusion

**Sanity would be beneficial for event detail pages if:**
- ✅ You want to manually curate high-value events
- ✅ You need better SEO for important events
- ✅ You want to add rich editorial content
- ✅ Marketing team needs to update content without developers

**Sanity might NOT be worth it if:**
- ❌ All events are treated equally (no manual curation needed)
- ❌ Auto-generated text is sufficient
- ❌ You don't have resources to curate content
- ❌ Budget is very tight

**Recommendation:** Start with 5-10 high-value events (Monaco GP, Wimbledon final, Champions League final, etc.) and see the impact. If conversion improves, expand to more events.

