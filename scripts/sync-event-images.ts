/**
 * Sync Event Images Script
 * 
 * This script:
 * 1. Lists all image files in the Supabase Storage bucket (images/events/)
 * 2. Matches them to events by event_id
 * 3. Updates the events.image column with the storage path
 * 
 * Usage:
 *   npm run sync-event-images
 *   or
 *   tsx scripts/sync-event-images.ts
 */

import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";

interface ImageFile {
	name: string;
	id: string;
	updated_at: string;
	created_at: string;
	last_accessed_at: string;
	metadata: {
		size: number;
		mimetype: string;
		cacheControl: string;
	};
}

async function syncEventImages() {
	console.log("🖼️  Starting event image sync...\n");

	const supabase = getSupabaseAdmin();
	const bucket = "images";
	const folder = "events";

	// Step 1: List all files in the events folder
	console.log(`📂 Listing files in bucket: ${bucket}/${folder}`);
	
	const { data: files, error: listError } = await supabase.storage
		.from(bucket)
		.list(folder, {
			limit: 1000,
			offset: 0,
			sortBy: { column: "name", order: "asc" },
		});

	if (listError) {
		console.error("❌ Error listing files:", listError);
		process.exit(1);
	}

	if (!files || files.length === 0) {
		console.log("⚠️  No files found in the events folder.");
		process.exit(0);
	}

	console.log(`✅ Found ${files.length} image files\n`);

	// Step 2: Extract event IDs from filenames and prepare updates
	const updates: Array<{ eventId: string; imagePath: string; filename: string }> = [];

	for (const file of files) {
		// Skip directories
		if (!file.name || file.id === null) continue;

		// Extract event_id from filename (remove extension)
		// Example: "845e9bbebc7d41b39b5f77a6dd7bd022_spp.webp" -> "845e9bbebc7d41b39b5f77a6dd7bd022_spp"
		const eventId = file.name.replace(/\.(webp|jpg|jpeg|png|gif)$/i, "");
		
		if (!eventId) {
			console.warn(`⚠️  Skipping file with invalid name: ${file.name}`);
			continue;
		}

		// Storage path format: "events/{filename}"
		const imagePath = `${folder}/${file.name}`;

		updates.push({
			eventId,
			imagePath,
			filename: file.name,
		});
	}

	console.log(`📝 Prepared ${updates.length} updates\n`);

	// Step 3: Verify events exist and update them
	let successCount = 0;
	let notFoundCount = 0;
	let errorCount = 0;

	for (const { eventId, imagePath, filename } of updates) {
		try {
			// Check if event exists - try case-insensitive match first, then exact match
			let queryResult = await supabase
				.from("events")
				.select("event_id, image")
				.eq("event_id", eventId)
				.single();

			// If not found, try case-insensitive search
			if (queryResult.error || !queryResult.data) {
				const { data: allEvents } = await supabase
					.from("events")
					.select("event_id")
					.limit(1000);
				
				const matchingEvent = (allEvents as any[])?.find((e: any) => 
					e.event_id?.toLowerCase() === eventId.toLowerCase()
				);
				
				if (matchingEvent) {
					console.log(`⚠️  Case mismatch found: ${eventId} -> ${matchingEvent.event_id}`);
					queryResult = await supabase
						.from("events")
						.select("event_id, image")
						.eq("event_id", matchingEvent.event_id)
						.single();
				}
			}

			const event = queryResult.data as { event_id: string; image: string | null } | null;
			const fetchError = queryResult.error;

			if (fetchError || !event) {
				console.warn(`⚠️  Event not found: ${eventId} (file: ${filename})`);
				if (fetchError) {
					console.warn(`   Error: ${fetchError.message}`);
				}
				notFoundCount++;
				continue;
			}

			// Skip if image is already set (unless you want to overwrite)
			if (event.image === imagePath) {
				console.log(`✓ Already set: ${eventId}`);
				successCount++;
				continue;
			}

			// Update the event
			const updateResult = await (supabase
				.from("events") as any)
				.update({ image: imagePath })
				.eq("event_id", eventId);

			const updateError = updateResult.error;

			if (updateError) {
				console.error(`❌ Error updating ${eventId}:`, updateError.message);
				errorCount++;
			} else {
				console.log(`✅ Updated: ${eventId} -> ${imagePath}`);
				successCount++;
			}
		} catch (err: any) {
			console.error(`❌ Unexpected error for ${eventId}:`, err.message);
			errorCount++;
		}
	}

	// Step 4: Summary
	console.log("\n" + "=".repeat(50));
	console.log("📊 Sync Summary:");
	console.log("=".repeat(50));
	console.log(`✅ Successfully updated: ${successCount}`);
	console.log(`⚠️  Events not found: ${notFoundCount}`);
	console.log(`❌ Errors: ${errorCount}`);
	console.log(`📁 Total files processed: ${updates.length}`);
	console.log("=".repeat(50));

	if (errorCount > 0) {
		process.exit(1);
	}
}

// Run the script
syncEventImages().catch((error) => {
	console.error("💥 Fatal error:", error);
	process.exit(1);
});

