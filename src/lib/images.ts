/**
 * Enterprise Image Management System
 * 
 * Centralized image path configuration for Apex Tickets.
 * Currently using Unsplash images for all visuals.
 */

// Unsplash image URLs - high quality sports photography
const UNSPLASH_IMAGES = {
	// Hero images
	hero: {
		default: "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop",
		sports: "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop",
	},
	
	// Sport category images
	sports: {
		formula1: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
		football: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop",
		motogp: "https://images.unsplash.com/photo-1502899576159-f224dc2349fa?q=80&w=1200&auto=format&fit=crop",
		tennis: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200&auto=format&fit=crop",
		rugby: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1200&auto=format&fit=crop",
		default: "https://images.unsplash.com/photo-1579952363873-27f3b1f6b9b0?q=80&w=1200&auto=format&fit=crop",
	},
	
	// Event images
	events: {
		default: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop",
	},
	
	// Placeholder images
	placeholders: {
		event: "https://images.unsplash.com/photo-1579952363873-27f3b1f6b9b0?q=80&w=1200&auto=format&fit=crop",
		sport: "https://images.unsplash.com/photo-1579952363873-27f3b1f6b9b0?q=80&w=1200&auto=format&fit=crop",
	},
} as const;

export const IMAGE_PATHS = UNSPLASH_IMAGES;

/**
 * Get sport image path (returns placeholder for now)
 */
export function getSportImage(sportType?: string | null): string {
	if (!sportType) return IMAGE_PATHS.placeholders.sport;
	const normalized = String(sportType).toLowerCase().replace("_", "");
	return IMAGE_PATHS.sports[normalized as keyof typeof IMAGE_PATHS.sports] ?? IMAGE_PATHS.sports.default;
}

/**
 * Get event image path (returns placeholder for now)
 */
export function getEventImage(eventId?: string, sportType?: string): string {
	// For now, return sport-specific placeholder
	return getSportImage(sportType);
}

/**
 * Get hero image path (returns placeholder for now)
 */
export function getHeroImage(variant: "default" | "sports" = "default"): string {
	return IMAGE_PATHS.hero[variant];
}

