# Country Flags System

## Overview

Apex Tickets uses SVG country flags stored in `public/images/country-flags/` for all flag displays throughout the application.

## Directory Structure

```
public/images/country-flags/
├── us.svg       # United States (ISO 3166-1 alpha-2: US)
├── gb.svg       # United Kingdom (ISO 3166-1 alpha-2: GB)
├── gb-eng.svg   # England (UK subdivision)
├── gb-sct.svg   # Scotland (UK subdivision)
├── gb-wls.svg   # Wales (UK subdivision)
├── gb-nir.svg   # Northern Ireland (UK subdivision)
├── ...          # All other countries using ISO 3166-1 alpha-2 codes
└── [all other country codes].svg
```

## Flag Naming Convention

Flags are named using ISO 3166-1 alpha-2 country codes in lowercase:
- `us.svg` for United States
- `gb.svg` for United Kingdom
- `fr.svg` for France
- etc.

Special cases:
- UK subdivisions: `gb-eng.svg`, `gb-sct.svg`, `gb-wls.svg`, `gb-nir.svg`

## Usage

### CountryFlag Component

Use the `CountryFlag` component for displaying flags throughout the application:

```tsx
import { CountryFlag } from "@/components/country-flag";

// Using ISO3 code (from API)
<CountryFlag countryCode="USA" size={24} />

// Using ISO2 code directly
<CountryFlag iso2="US" size={24} />

// With custom styling
<CountryFlag 
  countryCode="GBR" 
  size={32} 
  className="rounded border"
  alt="United Kingdom flag"
/>
```

### Component Props

- `countryCode?: string | null` - ISO 3166-1 alpha-3 country code (e.g., "USA", "GBR")
- `iso2?: string | null` - ISO 3166-1 alpha-2 country code (e.g., "US", "GB") - takes precedence over `countryCode`
- `size?: number` - Size of the flag in pixels (default: 24)
- `className?: string` - Additional CSS classes
- `alt?: string` - Alt text for accessibility (default: "Flag of {code}")

## Integration with XS2 API

The XS2 API provides country codes in ISO 3166-1 alpha-3 format (e.g., `iso_country: "USA"`). The `CountryFlag` component automatically converts these to ISO2 codes and loads the appropriate SVG file.

## Components Using Country Flags

- `EventCard` - Shows flag next to event name
- `UpcomingEventsSlider` - Displays flags in event carousel cards
- `SiteHeader` - Navigation dropdowns (Formula 1, MotoGP, Tennis, Other events)
- `EventCardHero` - Hero event cards with flags

## Benefits

1. **Scalability**: SVG format ensures crisp display at any size
2. **Performance**: SVG files are lightweight and cached by browser
3. **Consistency**: Single source of truth for all flag images
4. **Accessibility**: Proper alt text and semantic HTML
5. **Type Safety**: TypeScript ensures correct usage

## Adding New Flags

1. Add the SVG file to `public/images/country-flags/` using ISO2 code naming
2. Ensure the SVG is optimized for web use
3. The component will automatically load it when the country code is used

## Migration from Emoji Flags

All emoji-based flags have been migrated to SVG flags:
- More consistent rendering across platforms
- Better scalability
- Professional appearance
- No font/emoji rendering issues

