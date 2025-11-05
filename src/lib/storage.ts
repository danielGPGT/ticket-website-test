/**
 * Supabase Storage Utilities
 * 
 * Helper functions for working with Supabase Storage for event images
 */

/**
 * Get public URL for an image stored in Supabase Storage
 * 
 * @param imagePath - Path in storage bucket (e.g., "events/845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp")
 * @param bucket - Bucket name (default: "images")
 * @returns Full public URL to the image
 */
export function getStorageImageUrl(imagePath: string | null | undefined, bucket: string = "images"): string | null {
	if (!imagePath) {
		if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
			console.warn('[getStorageImageUrl] No image path provided');
		}
		return null;
	}
	
	// If already a full URL, return as-is
	if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
		return imagePath;
	}
	
	// Remove leading slash if present
	const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
	
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!supabaseUrl) {
		console.warn("[getStorageImageUrl] NEXT_PUBLIC_SUPABASE_URL is not set");
		if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
			console.warn('[getStorageImageUrl] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
		}
		return null;
	}
	
	// Construct public URL for Supabase Storage
	const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
	return url;
}

/**
 * Get the storage path for an event image
 * 
 * @param eventId - Event ID
 * @param extension - File extension (default: "webp")
 * @returns Storage path (e.g., "events/845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp")
 */
export function getEventImageStoragePath(eventId: string, extension: string = "webp"): string {
	const normalizedId = String(eventId).toLowerCase().trim();
	return `events/${normalizedId}.${extension}`;
}

/**
 * Upload an event image to Supabase Storage
 * 
 * @param eventId - Event ID
 * @param file - File to upload
 * @param bucket - Bucket name (default: "images")
 * @returns Storage path if successful, null otherwise
 */
export async function uploadEventImage(
	eventId: string,
	file: File | Blob,
	bucket: string = "images"
): Promise<string | null> {
	const { getSupabaseAdmin } = await import("./supabase-admin");
	const supabase = getSupabaseAdmin();
	
	// Extract file extension from File name, or default to webp
	const fileExtension = file instanceof File && file.name ? file.name.split(".").pop() || "webp" : "webp";
	const storagePath = getEventImageStoragePath(eventId, fileExtension);
	
	const { error } = await supabase.storage
		.from(bucket)
		.upload(storagePath, file, {
			upsert: true, // Overwrite if exists
			contentType: file.type || "image/webp",
		});
	
	if (error) {
		console.error("Error uploading image:", error);
		return null;
	}
	
	return storagePath;
}

/**
 * Delete an event image from Supabase Storage
 * 
 * @param imagePath - Storage path to delete
 * @param bucket - Bucket name (default: "images")
 * @returns True if successful, false otherwise
 */
export async function deleteEventImage(
	imagePath: string,
	bucket: string = "images"
): Promise<boolean> {
	const { getSupabaseAdmin } = await import("./supabase-admin");
	const supabase = getSupabaseAdmin();
	
	// Remove leading slash if present
	const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
	
	const { error } = await supabase.storage
		.from(bucket)
		.remove([cleanPath]);
	
	if (error) {
		console.error("Error deleting image:", error);
		return false;
	}
	
	return true;
}

/**
 * Check if an image exists in Supabase Storage
 * 
 * @param imagePath - Storage path to check
 * @param bucket - Bucket name (default: "images")
 * @returns True if image exists, false otherwise
 */
export async function imageExists(
	imagePath: string,
	bucket: string = "images"
): Promise<boolean> {
	const { getSupabaseAdmin } = await import("./supabase-admin");
	const supabase = getSupabaseAdmin();
	
	// Remove leading slash if present
	const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
	
	const { data, error } = await supabase.storage
		.from(bucket)
		.list(cleanPath.split("/").slice(0, -1).join("/"), {
			search: cleanPath.split("/").pop(),
		});
	
	if (error) {
		console.error("Error checking image existence:", error);
		return false;
	}
	
	return (data?.length ?? 0) > 0;
}

