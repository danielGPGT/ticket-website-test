/**
 * Sync sport images from Supabase Storage to database
 * 
 * This script:
 * 1. Lists all images in the "sports" folder of the "images" bucket
 * 2. Extracts sport_id from filenames (e.g., "formula1.webp" -> "FORMULA1")
 * 3. Updates the image column in the sports table with the storage path
 * 
 * Usage: npm run sync-sport-images
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";

async function syncSportImages() {
	console.log("🔄 Starting sport image sync...\n");

	const supabase = getSupabaseAdmin();
	const folder = "sports";

	// Step 1: List all files in the sports folder
	console.log(`📁 Listing files in storage: ${folder}/`);
	const { data: files, error: listError } = await supabase.storage
		.from("images")
		.list(folder);

	if (listError) {
		console.error("❌ Error listing files:", listError.message);
		process.exit(1);
	}

	if (!files || files.length === 0) {
		console.log("⚠️  No files found in sports folder");
		return;
	}

	console.log(`✅ Found ${files.length} file(s)\n`);

	// Step 2: Extract sport IDs and prepare updates
	const updates: Array<{ sportId: string; imagePath: string; filename: string }> = [];

	for (const file of files) {
		// Skip directories
		if (!file.name || file.id === null) continue;

		// Skip placeholder files
		if (file.name.startsWith('.') || file.name.toLowerCase().includes('placeholder')) {
			continue;
		}
		
		// Extract sport_id from filename (remove extension)
		// Example: "formula1.webp" -> "formula1"
		// Example: "football.jpg" -> "football" (but database might have "soccer")
		// Handle .avif extension too
		const filenameWithoutExt = file.name.replace(/\.(webp|jpg|jpeg|png|gif|avif)$/i, "");
		
		// Keep lowercase (database uses lowercase sport_ids)
		// Handle different formats: "formula1" -> "formula1", "formula_1" -> "formula1"
		let sportId = filenameWithoutExt.toLowerCase().replace(/_/g, "");
		
		// Map common variations to database values
		const sportIdMap: Record<string, string> = {
			"football": "soccer", // "football.jpg" -> "soccer" in database
		};
		
		if (sportIdMap[sportId]) {
			sportId = sportIdMap[sportId];
		}
		
		if (!sportId) {
			console.warn(`⚠️  Skipping file with invalid name: ${file.name}`);
			continue;
		}

		// Storage path format: "sports/{filename}"
		const imagePath = `${folder}/${file.name}`;

		updates.push({
			sportId: sportId,
			imagePath,
			filename: file.name,
		});
	}

	console.log(`📝 Prepared ${updates.length} updates\n`);

	// Step 3: Verify sports exist and update them
	let successCount = 0;
	let notFoundCount = 0;
	let errorCount = 0;

	for (const { sportId: normalizedSportId, imagePath, filename } of updates) {
		try {
			// Check if sport exists - try exact match first
			let queryResult = await supabase
				.from("sports")
				.select("sport_id, image")
				.eq("sport_id", normalizedSportId)
				.single();

			// If not found, try case-insensitive search
			let actualSportId = normalizedSportId;
			if (queryResult.error || !queryResult.data) {
				const { data: allSports } = await supabase
					.from("sports")
					.select("sport_id")
					.limit(100);
				
				const matchingSport = (allSports as any[])?.find((s: any) => 
					s.sport_id?.toLowerCase() === normalizedSportId.toLowerCase() ||
					s.sport_id?.toLowerCase().replace(/_/g, "") === normalizedSportId.replace(/_/g, "")
				);
				
				if (matchingSport) {
					console.log(`   Found match: ${normalizedSportId} -> ${matchingSport.sport_id}`);
					actualSportId = matchingSport.sport_id; // Use the actual database value
					queryResult = await supabase
						.from("sports")
						.select("sport_id, image")
						.eq("sport_id", matchingSport.sport_id)
						.single();
				}
			}

			const sport = queryResult.data as { sport_id: string; image: string | null } | null;
			const fetchError = queryResult.error;

			if (fetchError || !sport) {
				console.warn(`⚠️  Sport not found: ${normalizedSportId} (file: ${filename})`);
				if (fetchError && !fetchError.message.includes("0 rows")) {
					console.warn(`   Error: ${fetchError.message}`);
				} else {
					console.warn(`   Tip: Make sure sport "${normalizedSportId}" exists in the database`);
				}
				notFoundCount++;
				continue;
			}

			// Skip if image is already set (unless you want to overwrite)
			if (sport.image === imagePath) {
				console.log(`✓ Already set: ${actualSportId}`);
				successCount++;
				continue;
			}

			// Update the sport
			const updateResult = await (supabase.from("sports") as any)
				.update({ image: imagePath })
				.eq("sport_id", actualSportId);

			if (updateResult.error) {
				console.error(`❌ Error updating ${actualSportId}:`, updateResult.error.message);
				errorCount++;
			} else {
				console.log(`✅ Updated: ${actualSportId} -> ${imagePath}`);
				successCount++;
			}
		} catch (error: any) {
			console.error(`❌ Error processing ${normalizedSportId}:`, error.message);
			errorCount++;
		}
	}

	// Summary
	console.log("\n" + "=".repeat(50));
	console.log("📊 Summary:");
	console.log("=".repeat(50));
	console.log(`Total files: ${files.length}`);
	console.log(`✅ Successfully updated: ${successCount}`);
	console.log(`⚠️  Not found: ${notFoundCount}`);
	console.log(`❌ Errors: ${errorCount}`);
	console.log("=".repeat(50));
}

syncSportImages().catch(console.error);

