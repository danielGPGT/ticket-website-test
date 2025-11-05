/**
 * Check what sports exist in the database
 * 
 * Usage: tsx scripts/check-sports.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";

async function checkSports() {
	console.log("🔍 Checking sports in database...\n");

	const supabase = getSupabaseAdmin();

	const { data: sports, error } = await supabase
		.from("sports")
		.select("sport_id, image")
		.order("sport_id");

	if (error) {
		console.error("❌ Error:", error.message);
		return;
	}

	if (!sports || sports.length === 0) {
		console.log("⚠️  No sports found in database");
		return;
	}

	console.log(`✅ Found ${sports.length} sport(s):\n`);
	sports.forEach((sport: any) => {
		console.log(`  - ${sport.sport_id} (image: ${sport.image || "(null)"})`);
	});
}

checkSports().catch(console.error);

