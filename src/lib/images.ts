/**
 * Enterprise Image Management System
 * 
 * Centralized image path configuration for Apex Tickets.
 * Uses Unsplash images for sport-specific visuals.
 * 
 * Strategy: For thousands of events, we use sport-based images rather than
 * individual event images. This is scalable and maintains visual consistency.
 * 
 * Event images are now stored in Supabase Storage and referenced via the
 * `image` column in the events table.
 */

import { getStorageImageUrl } from "./storage";

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
 * Priority:
 * 1. Database image column (Supabase Storage URL or path)
 * 2. Local file from public/images/sports/ directory
 * 3. Unsplash fallback URL
 * 
 * @param sportType - Sport type (e.g., "FOOTBALL", "FORMULA1", "tennis")
 * @param sport - Optional sport object from database with image column
 * @returns Image path or URL
 */
export function getSportImage(sportType?: string | null, sport?: any): string {
	// 1. Check database image column (highest priority - Supabase Storage)
	if (sport?.image) {
		const storageUrl = getStorageImageUrl(sport.image);
		if (storageUrl) {
			return storageUrl;
		}
		// If getStorageImageUrl returns null, it might be a full URL already
		// Try using it directly if it looks like a URL
		if (sport.image.startsWith("http://") || sport.image.startsWith("https://")) {
			return sport.image;
		}
	}
	
	if (!sportType) {
		// Try local default, fallback to Unsplash
		return "/images/sports/default.jpg";
	}
	
	const normalized = String(sportType)
		.toLowerCase()
		.replace(/_/g, "")
		.replace(/\s+/g, "");
	
	// 2. Use local file from public/images/sports/ directory
	const localPath = `/images/sports/${normalized}.webp`;
	
	// Return local file path - Next.js will serve it
	// If the file doesn't exist, fallback to Unsplash
	return localPath;
	
	// 3. Fallback to Unsplash if local file doesn't exist (uncomment if needed):
	// return IMAGE_PATHS.sports[normalized as keyof typeof IMAGE_PATHS.sports] ?? IMAGE_PATHS.sports.default;
}

/**
 * Get tournament image path
 * 
 * Priority:
 * 1. Database image column (Supabase Storage URL or path)
 * 2. Sport-specific image (fallback)
 * 
 * @param tournamentId - Tournament ID
 * @param tournament - Optional tournament object from database with image column
 * @param sportType - Optional sport type for fallback
 * @param sport - Optional sport object for fallback
 * @returns Image path or URL
 */
export function getTournamentImage(
	tournamentId?: string | null,
	tournament?: any,
	sportType?: string | null,
	sport?: any
): string {
	// 1. Check database image column (highest priority - Supabase Storage)
	if (tournament?.image) {
		const storageUrl = getStorageImageUrl(tournament.image);
		if (storageUrl) {
			if (process.env.NODE_ENV === "development") {
				console.log(`[getTournamentImage] Using tournament image: ${storageUrl}`);
			}
			return storageUrl;
		}
		// If getStorageImageUrl returns null, it might be a full URL already
		// Try using it directly if it looks like a URL
		if (tournament.image.startsWith("http://") || tournament.image.startsWith("https://")) {
			if (process.env.NODE_ENV === "development") {
				console.log(`[getTournamentImage] Using tournament image (direct URL): ${tournament.image}`);
			}
			return tournament.image;
		}
	}
	
	// 2. Fallback to sport-specific image
	if (process.env.NODE_ENV === "development") {
		console.log(`[getTournamentImage] No tournament image found, falling back to sport image for ${sportType}`);
	}
	return getSportImage(sportType, sport);
}

/**
 * Get event image path
 * 
 * Priority:
 * 1. Event database image column (Supabase Storage URL or path)
 * 2. API-provided image URL (if available)
 * 3. Tournament image (if tournament_id is available)
 * 4. Sport-specific image (fallback)
 * 
 * Image Storage:
 * - Images stored in Supabase Storage bucket "images" under path "events/{eventId}.webp"
 * - The database column stores either a full URL or a storage path
 * - Full URLs are returned as-is, storage paths are converted to public URLs
 */
export function getEventImage(
	eventId?: string, 
	sportType?: string,
	event?: any, // Full event object for slug generation and API image URLs
	tournament?: any, // Tournament object with image column
	sport?: any // Sport object with image column
): string {
	// 1. Check event database image column (highest priority - Supabase Storage)
	if (event?.image) {
		const storageUrl = getStorageImageUrl(event.image);
		if (storageUrl) {
			return storageUrl;
		}
		// If getStorageImageUrl returns null, it might be a full URL already
		// Try using it directly if it looks like a URL
		if (event.image.startsWith("http://") || event.image.startsWith("https://")) {
			return event.image;
		}
	}
	
	// 2. Check if API provides image URL (legacy support)
	if (event?.image_url || event?.photo_url) {
		return event.image_url || event.photo_url;
	}
	
	// 3. Fallback to tournament image if tournament_id is available
	if (event?.tournament_id && tournament) {
		const tournamentImage = getTournamentImage(event.tournament_id, tournament, sportType, sport);
		// Only use tournament image if it's not the same as sport image (to avoid unnecessary fallback)
		if (tournamentImage && tournamentImage !== getSportImage(sportType, sport)) {
			return tournamentImage;
		}
	}
	
	// 4. Fallback to sport-specific image
	return getSportImage(sportType, sport);
}

/**
 * Get hero image path (returns placeholder for now)
 */
export function getHeroImage(variant: "default" | "sports" = "default"): string {
	return IMAGE_PATHS.hero[variant];
}

