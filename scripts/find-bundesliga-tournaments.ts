/**
 * Find all tournaments beginning with "Bundesliga" in the name
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";

async function findBundesligaTournaments() {
	const supabase = getSupabaseAdmin();

	console.log("🔍 Searching for tournaments beginning with 'Bundesliga'...\n");

	// Get all tournaments with names starting with "Bundesliga"
	const { data: tournaments, error } = await supabase
		.from("tournaments")
		.select("tournament_id, official_name, sport_type, image, date_start, date_stop")
		.ilike("official_name", "Bundesliga%")
		.order("official_name", { ascending: true });

	if (error) {
		console.error("❌ Error:", error.message);
		return;
	}

	if (!tournaments || tournaments.length === 0) {
		console.log("⚠️  No tournaments found starting with 'Bundesliga'");
		return;
	}

	console.log(`✅ Found ${tournaments.length} tournament(s) starting with 'Bundesliga':\n`);
	console.log("=".repeat(100));

	tournaments.forEach((tournament: any, index: number) => {
		console.log(`\n${index + 1}. ${tournament.official_name}`);
		console.log(`   Tournament ID: ${tournament.tournament_id}`);
		console.log(`   Sport Type: ${tournament.sport_type}`);
		console.log(`   Image: ${tournament.image || "❌ None"}`);
		console.log(`   Date Start: ${tournament.date_start || "N/A"}`);
		console.log(`   Date Stop: ${tournament.date_stop || "N/A"}`);
	});

	console.log("\n" + "=".repeat(100));
	console.log(`\n📊 Summary: ${tournaments.length} tournament(s) found`);
	
	// Count with images
	const withImages = tournaments.filter((t: any) => t.image);
	console.log(`   ✅ With images: ${withImages.length}`);
	console.log(`   ⚠️  Without images: ${tournaments.length - withImages.length}`);
}

findBundesligaTournaments().catch(console.error);

