/**
 * Debug script to check a specific event's image
 * 
 * Usage: tsx scripts/debug-event-image.ts <event_id>
 * Example: tsx scripts/debug-event-image.ts 845e9bbebc7d41b39b5f77a6dd7bd022_spp
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";
import { getStorageImageUrl } from "../src/lib/storage";

async function debugEventImage(eventId: string) {
	console.log(`🔍 Debugging event image for: ${eventId}\n`);

	const supabase = getSupabaseAdmin();

	// Step 1: Check database
	console.log("1️⃣ Checking database...");
	const { data: event, error: dbError } = await supabase
		.from("events")
		.select("event_id, event_name, image")
		.eq("event_id", eventId)
		.single();

	if (dbError || !event) {
		console.error(`❌ Event not found in database: ${eventId}`);
		console.error("   Error:", dbError?.message);
		return;
	}

	console.log(`✅ Event found: ${(event as any).event_name}`);
	console.log(`   Database image column: ${(event as any).image || "(null)"}`);
	console.log(`   Has image: ${!!(event as any).image}\n`);

	const eventData = event as { event_id: string; event_name: string; image: string | null };
	
	if (!eventData.image) {
		console.log("⚠️  Event has no image in database!");
		console.log("   Run: npm run sync-event-images\n");
		return;
	}

	// Step 2: Check storage file
	console.log("2️⃣ Checking storage file...");
	const { data: storageFiles, error: storageError } = await supabase.storage
		.from("images")
		.list("events", {
			search: eventId,
		});

	if (storageError) {
		console.error(`❌ Error checking storage:`, storageError.message);
		return;
	}

	const matchingFiles = storageFiles?.filter(f => f.name?.startsWith(eventId)) || [];
	console.log(`   Found ${matchingFiles.length} matching file(s):`);
	matchingFiles.forEach(f => {
		console.log(`   - ${f.name}`);
	});

	if (matchingFiles.length === 0) {
		console.log(`\n⚠️  No file found in storage matching: ${eventId}.*`);
		console.log(`   Expected path: events/${eventId}.{ext}`);
		return;
	}

	// Step 3: Verify URL generation
	console.log("\n3️⃣ Verifying URL generation...");
	const storageUrl = getStorageImageUrl(eventData.image);
	console.log(`   Storage path: ${eventData.image}`);
	console.log(`   Generated URL: ${storageUrl || "(null)"}`);

	if (!storageUrl) {
		console.error("❌ Failed to generate storage URL!");
		console.log("   Check NEXT_PUBLIC_SUPABASE_URL environment variable");
		return;
	}

	// Step 4: Check if URL is accessible
	console.log("\n4️⃣ Testing URL accessibility...");
	try {
		const response = await fetch(storageUrl, { method: "HEAD" });
		console.log(`   HTTP Status: ${response.status}`);
		if (response.ok) {
			console.log(`   ✅ URL is accessible!`);
			console.log(`   Content-Type: ${response.headers.get("content-type")}`);
		} else {
			console.log(`   ⚠️  URL returned ${response.status} - image may not be accessible`);
		}
	} catch (error: any) {
		console.error(`   ❌ Error fetching URL:`, error.message);
	}

	// Summary
	console.log("\n" + "=".repeat(50));
	console.log("📊 Summary:");
	console.log("=".repeat(50));
	console.log(`Event ID: ${eventId}`);
	console.log(`Event Name: ${eventData.event_name}`);
	console.log(`Database Image: ${eventData.image || "(null)"}`);
	console.log(`Storage Files: ${matchingFiles.length}`);
	console.log(`Generated URL: ${storageUrl || "(null)"}`);
	console.log("=".repeat(50));
}

// Get event ID from command line
const eventId = process.argv[2];

if (!eventId) {
	console.error("❌ Please provide an event ID");
	console.log("\nUsage: tsx scripts/debug-event-image.ts <event_id>");
	console.log("Example: tsx scripts/debug-event-image.ts 845e9bbebc7d41b39b5f77a6dd7bd022_spp");
	process.exit(1);
}

debugEventImage(eventId).catch(console.error);

