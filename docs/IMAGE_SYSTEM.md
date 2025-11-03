# Enterprise Image Management System

## Overview

Apex Tickets uses a centralized image management system for consistent, optimized image handling across the application.

## Directory Structure

```
public/images/
├── hero/              # Hero section backgrounds
│   ├── default-hero.jpg
│   └── sports-hero.jpg
├── sports/            # Sport category images
│   ├── formula1.jpg
│   ├── football.jpg
│   ├── motogp.jpg
│   ├── tennis.jpg
│   └── default.jpg
├── events/            # Event-specific images (optional)
│   └── default-event.jpg
└── placeholders/      # Fallback images
    ├── event-placeholder.jpg
    └── sport-placeholder.jpg
```

## Image Configuration

All image paths are managed through `src/lib/images.ts`, which provides:

- **Centralized path management**: Single source of truth for all image paths
- **Type-safe helpers**: Functions like `getSportImage()`, `getHeroImage()`, `getEventImage()`
- **Fallback handling**: Automatic fallback to placeholder images when specific images aren't available

## Usage Examples

### In Components

```tsx
import Image from "next/image";
import { getSportImage, getHeroImage } from "@/lib/images";

// Hero background
<Image
  src={getHeroImage("sports")}
  alt="Sports hero"
  fill
  priority
  className="object-cover"
/>

// Sport category card
<Image
  src={getSportImage("formula1")}
  alt="Formula 1"
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
```

## Image Requirements

### Hero Images
- **Dimensions**: 1920x1080px (16:9)
- **Format**: JPG or WebP
- **File Size**: < 500KB
- **Usage**: Full-width hero backgrounds

### Sport Images
- **Dimensions**: 1200x800px (3:2)
- **Format**: JPG or WebP
- **File Size**: < 300KB
- **Usage**: Sport category cards and sections

### Event Images (Future)
- **Dimensions**: 1200x800px (3:2)
- **Format**: JPG or WebP
- **Naming**: `{event-id}.jpg` or descriptive names
- **Usage**: Event detail pages, carousels

## Benefits

1. **Consistency**: All images follow the same structure and naming conventions
2. **Performance**: Next.js Image optimization with proper `sizes` attributes
3. **Maintainability**: Centralized configuration makes updates easy
4. **Type Safety**: TypeScript ensures correct image path usage
5. **Scalability**: Easy to add new image categories or types

## Adding New Images

1. Add the image file to the appropriate directory in `public/images/`
2. Update `src/lib/images.ts` if adding a new category or sport type
3. Use the helper functions in components
4. Always use Next.js `Image` component for optimization

## Migration from External Images

All Unsplash and external image references have been replaced with the local image system. When adding actual images:

1. Replace placeholder paths in `src/lib/images.ts` with actual image filenames
2. Ensure images meet size and format requirements
3. Test image loading and fallbacks

