/**
 * Sync tournament images from Supabase Storage to database
 * 
 * This script:
 * 1. Lists all images in the "tournaments" folder of the "images" bucket
 * 2. Extracts tournament_id from filenames (e.g., "tournament123.webp" -> "tournament123")
 * 3. Updates the image column in the tournaments table with the storage path
 * 
 * Usage: npm run sync-tournament-images
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";

async function syncTournamentImages() {
	console.log("🔄 Starting tournament image sync...\n");

	const supabase = getSupabaseAdmin();
	const folder = "tournaments";

	// Step 1: List all files in the tournaments folder
	console.log(`📁 Listing files in storage: ${folder}/`);
	const { data: files, error: listError } = await supabase.storage
		.from("images")
		.list(folder);

	if (listError) {
		console.error("❌ Error listing files:", listError.message);
		process.exit(1);
	}

	if (!files || files.length === 0) {
		console.log("⚠️  No files found in tournaments folder");
		return;
	}

	console.log(`✅ Found ${files.length} file(s)\n`);

	// Step 2: Extract tournament IDs and prepare updates
	const updates: Array<{ tournamentId: string; imagePath: string; filename: string }> = [];

	for (const file of files) {
		// Skip directories and placeholder files
		if (!file.name || file.id === null || file.name.startsWith('.') || file.name.toLowerCase().includes('placeholder')) {
			continue;
		}

		// Extract tournament_id from filename (remove extension)
		// Example: "tournament123.webp" -> "tournament123"
		// Handle .avif extension too
		const filenameWithoutExt = file.name.replace(/\.(webp|jpg|jpeg|png|gif|avif)$/i, "");
		
		// Keep the tournament ID as-is (database uses exact tournament_id)
		const tournamentId = filenameWithoutExt;
		
		if (!tournamentId) {
			console.warn(`⚠️  Skipping file with invalid name: ${file.name}`);
			continue;
		}

		// Storage path format: "tournaments/{filename}"
		const imagePath = `${folder}/${file.name}`;

		updates.push({
			tournamentId,
			imagePath,
			filename: file.name,
		});
	}

	console.log(`📝 Prepared ${updates.length} updates\n`);

	// Step 3: Verify tournaments exist and update them
	let successCount = 0;
	let notFoundCount = 0;
	let errorCount = 0;

	for (const { tournamentId, imagePath, filename } of updates) {
		try {
			// Check if tournament exists
			let queryResult = await supabase
				.from("tournaments")
				.select("tournament_id, image")
				.eq("tournament_id", tournamentId)
				.single();

			// If not found, try case-insensitive search
			let actualTournamentId = tournamentId;
			if (queryResult.error || !queryResult.data) {
				const { data: allTournaments } = await supabase
					.from("tournaments")
					.select("tournament_id")
					.limit(1000);
				
				const matchingTournament = (allTournaments as any[])?.find((t: any) => 
					t.tournament_id?.toLowerCase() === tournamentId.toLowerCase()
				);
				
				if (matchingTournament) {
					console.log(`   Found match: ${tournamentId} -> ${matchingTournament.tournament_id}`);
					actualTournamentId = matchingTournament.tournament_id;
					queryResult = await supabase
						.from("tournaments")
						.select("tournament_id, image")
						.eq("tournament_id", matchingTournament.tournament_id)
						.single();
				}
			}

			const tournament = queryResult.data as { tournament_id: string; image: string | null } | null;
			const fetchError = queryResult.error;

			if (fetchError || !tournament) {
				console.warn(`⚠️  Tournament not found: ${tournamentId} (file: ${filename})`);
				if (fetchError && !fetchError.message.includes("0 rows")) {
					console.warn(`   Error: ${fetchError.message}`);
				} else {
					console.warn(`   Tip: Make sure tournament "${tournamentId}" exists in the database`);
				}
				notFoundCount++;
				continue;
			}

			// Skip if image is already set (unless you want to overwrite)
			if (tournament.image === imagePath) {
				console.log(`✓ Already set: ${actualTournamentId}`);
				successCount++;
				continue;
			}

			// Update the tournament
			const updateResult = await (supabase.from("tournaments") as any)
				.update({ image: imagePath })
				.eq("tournament_id", actualTournamentId);

			if (updateResult.error) {
				console.error(`❌ Error updating ${actualTournamentId}:`, updateResult.error.message);
				errorCount++;
			} else {
				console.log(`✅ Updated: ${actualTournamentId} -> ${imagePath}`);
				successCount++;
			}
		} catch (error: any) {
			console.error(`❌ Error processing ${tournamentId}:`, error.message);
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

syncTournamentImages().catch(console.error);

