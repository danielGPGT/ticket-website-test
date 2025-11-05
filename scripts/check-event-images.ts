/**
 * Quick script to check if events have images in the database
 * 
 * Usage: tsx scripts/check-event-images.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";

async function checkEventImages() {
	console.log("🔍 Checking event images in database...\n");

	const supabase = getSupabaseAdmin();

	// Get a sample of events with images
	const { data: eventsWithImages, error: error1 } = await supabase
		.from("events")
		.select("event_id, event_name, image")
		.not("image", "is", null)
		.limit(5);

	if (error1) {
		console.error("❌ Error fetching events with images:", error1);
		return;
	}

	console.log(`✅ Found ${eventsWithImages?.length || 0} events with images:\n`);
	
	if (eventsWithImages && eventsWithImages.length > 0) {
		eventsWithImages.forEach((event: any) => {
			console.log(`  - ${event.event_name}`);
			console.log(`    ID: ${event.event_id}`);
			console.log(`    Image: ${event.image}`);
			console.log("");
		});
	} else {
		console.log("⚠️  No events found with images. Run sync script first!");
		console.log("   npm run sync-event-images\n");
	}

	// Get total count
	const { count: totalEvents } = await supabase
		.from("events")
		.select("*", { count: "exact", head: true });

	const { count: eventsWithImageCount } = await supabase
		.from("events")
		.select("*", { count: "exact", head: true })
		.not("image", "is", null);

	console.log(`📊 Statistics:`);
	console.log(`   Total events: ${totalEvents || 0}`);
	console.log(`   Events with images: ${eventsWithImageCount || 0}`);
	console.log(`   Coverage: ${totalEvents ? ((eventsWithImageCount || 0) / totalEvents * 100).toFixed(1) : 0}%`);
}

checkEventImages().catch(console.error);

