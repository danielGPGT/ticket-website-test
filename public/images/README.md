# Apex Tickets Image Directory

This directory contains all static images used throughout the Apex Tickets website.

## Directory Structure

```
images/
├── hero/              # Hero section background images
│   ├── default-hero.jpg
│   └── sports-hero.jpg
├── sports/            # Sport category images (used in cards, sections)
│   ├── formula1.jpg
│   ├── football.jpg
│   ├── motogp.jpg
│   ├── tennis.jpg
│   └── default.jpg
├── events/            # Event-specific images (optional, for future use)
│   └── default-event.jpg
└── placeholders/      # Fallback images when specific images aren't available
    ├── event-placeholder.jpg
    └── sport-placeholder.jpg
```

## Image Requirements

### Hero Images
- **Size**: 1920x1080px (16:9 aspect ratio)
- **Format**: JPG or WebP
- **Optimization**: Compressed for web (< 500KB recommended)
- **Purpose**: Full-width hero backgrounds

### Sport Images
- **Size**: 1200x800px (3:2 aspect ratio)
- **Format**: JPG or WebP
- **Optimization**: Compressed for web (< 300KB recommended)
- **Purpose**: Sport category cards and sections

### Event Images (Future)
- **Size**: 1200x800px (3:2 aspect ratio)
- **Format**: JPG or WebP
- **Naming**: `{event-id}.jpg` or `{sport-type}-{venue}.jpg`

## Usage

Images are referenced through the centralized image system in `src/lib/images.ts`:

```typescript
import { getSportImage, getHeroImage } from "@/lib/images";

// In components
<Image src={getSportImage("formula1")} alt="Formula 1" />
```

## Adding New Images

1. Add the image file to the appropriate directory
2. Update `src/lib/images.ts` if adding a new category or path
3. Use Next.js Image component for optimization:

```tsx
import Image from "next/image";
import { getSportImage } from "@/lib/images";

<Image 
  src={getSportImage("formula1")} 
  alt="Formula 1"
  width={1200}
  height={800}
/>
```

