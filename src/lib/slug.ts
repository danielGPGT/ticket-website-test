/**
 * Converts a string to a URL-friendly slug
 */
export function createSlug(text: string): string {
	if (!text) return "";
	
	return String(text)
		.toLowerCase()
		.trim()
		// Replace spaces and underscores with hyphens
		.replace(/[\s_]+/g, "-")
		// Remove special characters except hyphens
		.replace(/[^a-z0-9-]/g, "")
		// Replace multiple consecutive hyphens with a single hyphen
		.replace(/-+/g, "-")
		// Remove leading and trailing hyphens
		.replace(/^-+|-+$/g, "");
}

/**
 * Creates a slug from event data
 * Uses event name, venue, and date to create a unique slug
 */
export function createEventSlug(event: {
	name?: string;
	event_name?: string;
	official_name?: string;
	id?: string;
	event_id?: string;
}): string {
	const name = event.name ?? event.event_name ?? event.official_name ?? "event";
	let slug = createSlug(name);
	
	// If slug is empty or too short, use ID as fallback
	if (!slug || slug.length < 3) {
		const id = event.id ?? event.event_id ?? "";
		slug = `event-${id}`;
	}
	
	return slug;
}

/**
 * Extracts event ID from a slug if it contains an ID
 * Returns the slug as-is if no ID is found
 */
export function extractEventIdFromSlug(slug: string): string | null {
	// If slug starts with "event-" followed by numbers/letters, extract ID
	const match = slug.match(/^event-([a-z0-9-]+)$/i);
	if (match) {
		return match[1];
	}
	return null;
}

