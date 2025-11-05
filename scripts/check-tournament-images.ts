/**
 * Debug script to check tournament images in database
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";

async function checkTournamentImages() {
	const supabase = getSupabaseAdmin();

	console.log("🔍 Checking tournament images in database...\n");

	// Get all tournaments with images
	const { data: tournaments, error } = await supabase
		.from("tournaments")
		.select("tournament_id, official_name, sport_type, image")
		.order("sport_type", { ascending: true });

	if (error) {
		console.error("❌ Error:", error.message);
		return;
	}

	if (!tournaments || tournaments.length === 0) {
		console.log("⚠️  No tournaments found");
		return;
	}

	console.log(`📊 Total tournaments: ${tournaments.length}\n`);

	// Count tournaments with images
	const withImages = tournaments.filter((t: any) => t.image);
	const withoutImages = tournaments.filter((t: any) => !t.image);

	console.log(`✅ Tournaments with images: ${withImages.length}`);
	console.log(`⚠️  Tournaments without images: ${withoutImages.length}\n`);

	if (withImages.length > 0) {
		console.log("📸 Tournaments with images:");
		console.log("=".repeat(80));
		withImages.forEach((t: any) => {
			console.log(`\n  Tournament ID: ${t.tournament_id}`);
			console.log(`  Name: ${t.official_name}`);
			console.log(`  Sport: ${t.sport_type}`);
			console.log(`  Image: ${t.image}`);
		});
	}

	// Check popular leagues
	console.log("\n\n🏆 Popular Leagues (from PopularTournaments component):");
	console.log("=".repeat(80));
	const popularLeagues = [
		{ name: "Formula 1", sport: "formula1", search: "formula 1" },
		{ name: "MotoGP", sport: "motogp", search: "motogp" },
		{ name: "Tennis", sport: "tennis", search: "tennis" },
		{ name: "Champions League", sport: "soccer", search: "champions league" }, // Database uses "soccer"
		{ name: "Bundesliga", sport: "soccer", search: "bundesliga" }, // Database uses "soccer"
		{ name: "Premier League", sport: "soccer", search: "premier league" }, // Database uses "soccer"
	];

	for (const league of popularLeagues) {
		console.log(`\n  ${league.name} (sport: ${league.sport}):`);
		
		// Find matching tournaments
		const matches = tournaments.filter((t: any) => {
			const name = String(t.official_name ?? "").toLowerCase();
			const sportMatches = t.sport_type?.toLowerCase() === league.sport.toLowerCase();
			const nameMatches = name.includes(league.search.toLowerCase());
			return nameMatches && sportMatches;
		});

		if (matches.length > 0) {
			matches.forEach((match: any) => {
				console.log(`    ✅ Found: ${match.official_name} (${match.tournament_id})`);
				console.log(`       Image: ${match.image || "❌ None"}`);
			});
		} else {
			console.log(`    ⚠️  No matches found`);
		}
	}
}

checkTournamentImages().catch(console.error);

