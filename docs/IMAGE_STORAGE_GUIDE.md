# Event Image Storage Guide

## Overview

Event images are stored in Supabase Storage and referenced via the `image` column in the `events` table. This provides a scalable, centralized solution for managing event images.

## Architecture

### Storage Bucket
- **Bucket Name**: `images`
- **Path Structure**: `events/{event_id}.{extension}`
- **Public Access**: Yes (read-only for public)
- **File Size Limit**: 5MB
- **Allowed Formats**: JPEG, JPG, PNG, WebP, GIF

### Database Column
- **Column Name**: `image`
- **Type**: TEXT
- **Stores**: Storage path (e.g., `events/845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp`) or full URL

## Image Priority

The frontend follows this priority order when displaying event images:

1. **Database `image` column** (Supabase Storage URL or path)
2. **API-provided image URL** (legacy support: `image_url`, `photo_url`)
3. **Local event image files** (`/public/images/events/{eventId}.webp`)
4. **Sport-specific image** (fallback)

## Usage

### Frontend Components

The `EventImageWithFallback` component automatically handles all image sources:

```tsx
import { EventImageWithFallback } from "@/components/event-image-with-fallback";

<EventImageWithFallback
  eventId={event.event_id}
  sportType={event.sport_type}
  event={event} // Full event object with image column
  alt={event.event_name}
  fill
  priority
/>
```

### Helper Functions

#### Get Storage URL
```typescript
import { getStorageImageUrl } from "@/lib/storage";

const url = getStorageImageUrl("events/845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp");
// Returns: https://your-project.supabase.co/storage/v1/object/public/images/events/845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp
```

#### Upload Image
```typescript
import { uploadEventImage } from "@/lib/storage";

const file = // File or Blob object
const storagePath = await uploadEventImage(eventId, file);
// Returns: "events/845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp"
```

#### Update Database
After uploading, update the events table:
```sql
UPDATE events 
SET image = 'events/845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp'
WHERE event_id = '845e9bbebc7d41b39b5f77a6dd7bd022_spp';
```

## Migration from Local Files

If you have existing images in `/public/images/events/`, you can migrate them:

1. Upload each image to Supabase Storage using the storage utilities
2. Update the `image` column in the events table with the storage path
3. Optionally remove local files after migration

### Example Migration Script

```typescript
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { uploadEventImage } from "@/lib/storage";
import fs from "fs";
import path from "path";

async function migrateEventImages() {
  const supabase = getSupabaseAdmin();
  const eventsDir = path.join(process.cwd(), "public/images/events");
  const files = fs.readdirSync(eventsDir);

  for (const file of files) {
    // Extract event ID from filename (e.g., "845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp")
    const eventId = file.replace(/\.(webp|jpg|jpeg|png)$/i, "");
    
    // Read file
    const filePath = path.join(eventsDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);

    // Upload to Supabase Storage
    const storagePath = await uploadEventImage(eventId, blob, file);
    
    if (storagePath) {
      // Update database
      await supabase
        .from("events")
        .update({ image: storagePath })
        .eq("event_id", eventId);
      
      console.log(`Migrated ${file} -> ${storagePath}`);
    }
  }
}
```

## Best Practices

### Image Specifications
- **Recommended Size**: 1200x800px (3:2 aspect ratio)
- **Format**: WebP (best compression) or JPEG
- **File Size**: < 500KB for optimal performance
- **Naming**: Use event ID as filename: `{event_id}.webp`

### Performance
- Images are served via CDN (Supabase Storage CDN)
- Use Next.js `Image` component for optimization
- Set appropriate `sizes` attribute for responsive images

### Security
- Storage bucket is public for read access (images are public)
- Only authenticated users can upload/update/delete
- Consider restricting uploads to admin roles in production

## Troubleshooting

### Image Not Displaying
1. Check if `image` column has a value in the database
2. Verify the file exists in Supabase Storage
3. Check storage bucket policies (should be public for read)
4. Verify Supabase URL is correct in environment variables

### Upload Errors
1. Ensure you're using service role key (not anon key)
2. Check file size (max 5MB)
3. Verify file format is allowed
4. Check storage bucket exists and policies are set

## API Reference

See `src/lib/storage.ts` for complete API documentation:
- `getStorageImageUrl(path, bucket?)` - Get public URL for storage path
- `getEventImageStoragePath(eventId, extension?)` - Generate storage path
- `uploadEventImage(eventId, file, bucket?)` - Upload image
- `deleteEventImage(imagePath, bucket?)` - Delete image
- `imageExists(imagePath, bucket?)` - Check if image exists

