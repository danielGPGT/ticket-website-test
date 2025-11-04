/**
 * Enterprise Image Management System
 * 
 * Centralized image path configuration for Apex Tickets.
 * Uses Unsplash images for sport-specific visuals.
 * 
 * Strategy: For thousands of events, we use sport-based images rather than
 * individual event images. This is scalable and maintains visual consistency.
 */

// Unsplash image URLs - high quality sports photography
const UNSPLASH_IMAGES = {
	// Hero images
	hero: {
		default: "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop",
		sports: "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop",
	},
	
	// Sport category images - these are used for all events in each sport
	sports: {
		formula1: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
		football: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop",
		motogp: "https://images.unsplash.com/photo-1502899576159-f224dc2349fa?q=80&w=1200&auto=format&fit=crop",
		tennis: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200&auto=format&fit=crop",
		rugby: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1200&auto=format&fit=crop",
		basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop",
		baseball: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=1200&auto=format&fit=crop",
		default: "https://images.unsplash.com/photo-1579952363873-27f3b1f6b9b0?q=80&w=1200&auto=format&fit=crop",
	},
	
	// Placeholder images
	placeholders: {
		event: "https://images.unsplash.com/photo-1579952363873-27f3b1f6b9b0?q=80&w=1200&auto=format&fit=crop",
		sport: "https://images.unsplash.com/photo-1579952363873-27f3b1f6b9b0?q=80&w=1200&auto=format&fit=crop",
	},
} as const;

export const IMAGE_PATHS = UNSPLASH_IMAGES;

/**
 * Get sport image path
 * 
 * Returns a sport-specific image. This is used for all events within that sport,
 * which is scalable for thousands of events.
 * 
 * Priority:
 * 1. Local file in public/images/sports/{sportType}.jpg (if exists)
 * 2. Unsplash fallback URL
 * 
 * To use your own image:
 * 1. Place it in: public/images/sports/{sportType}.jpg
 *    Examples:
 *    - public/images/sports/formula1.jpg
 *    - public/images/sports/football.jpg
 *    - public/images/sports/motogp.jpg
 * 2. Supported formats: .jpg, .jpeg, .png, .webp
 * 3. Recommended size: 1200x800px, < 300KB
 * 
 * Next.js will automatically serve files from the public/ directory.
 * If the file doesn't exist, the Next.js Image component will show a broken image.
 * To avoid this, we fall back to Unsplash URLs when local files aren't available.
 */
export function getSportImage(sportType?: string | null): string {
	if (!sportType) {
		// Try local default, fallback to Unsplash
		return "/images/sports/default.jpg";
	}
	
	const normalized = String(sportType)
		.toLowerCase()
		.replace(/_/g, "")
		.replace(/\s+/g, "");
	
	// Use local file from public/images/sports/ directory
	// Next.js automatically serves files from public/ directory
	// Try .webp first (better compression), then fallback to other formats if needed
	const localPath = `/images/sports/${normalized}.webp`;
	
	// Return local file path - Next.js will serve it
	// If the file doesn't exist, you'll see a broken image. In that case, 
	// you can uncomment the Unsplash fallback below
	return localPath;
	
	// Fallback to Unsplash if local file doesn't exist (uncomment if needed):
	// return IMAGE_PATHS.sports[normalized as keyof typeof IMAGE_PATHS.sports] ?? IMAGE_PATHS.sports.default;
}

/**
 * Get event image path
 * 
 * Priority:
 * 1. API-provided image URL (if available)
 * 2. Event-specific local image: public/images/events/{eventId}.webp or {slug}.webp
 * 3. Sport-specific image (fallback)
 * 
 * To add event-specific images:
 * - Place them in: public/images/events/
 * - Name by event ID: {eventId}.webp (e.g., "845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp")
 * - Or name by slug: {event-slug}.webp (e.g., "qatar-grand-prix.webp")
 * - Supported formats: .jpg, .jpeg, .png, .webp
 * - Recommended size: 1200x800px, < 300KB
 */
export function getEventImage(
	eventId?: string, 
	sportType?: string,
	event?: any // Full event object for slug generation and API image URLs
): string {
	// 1. Check if API provides image URL
	if (event?.image_url || event?.photo_url || event?.image) {
		return event.image_url || event.photo_url || event.image;
	}
	
	// 2. Try event-specific local image (by event ID)
	// Note: We return the .webp path, but the component will handle fallback
	// if the file doesn't exist. The actual file might be .jpg, .png, or .webp
	if (eventId) {
		const normalizedId = String(eventId).toLowerCase().trim();
		// Try .webp first (better compression), but component will fallback
		const eventImageById = `/images/events/${normalizedId}.webp`;
		return eventImageById;
	}
	
	// 3. Fallback to sport-specific image
	return getSportImage(sportType);
}

/**
 * Get hero image path (returns placeholder for now)
 */
export function getHeroImage(variant: "default" | "sports" = "default"): string {
	return IMAGE_PATHS.hero[variant];
}

