/**
 * Verify a specific event's image setup
 * Checks database, storage, and URL generation
 * 
 * Usage: tsx scripts/verify-event-image.ts <event_id>
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseAdmin } from "../src/lib/supabase-admin";
import { getStorageImageUrl } from "../src/lib/storage";

async function verifyEventImage(eventId: string) {
	console.log(`🔍 Verifying event image for: ${eventId}\n`);
	console.log("=".repeat(60));

	const supabase = getSupabaseAdmin();

	// Step 1: Check database
	console.log("\n1️⃣ DATABASE CHECK");
	console.log("-".repeat(60));
	const { data: event, error: dbError } = await supabase
		.from("events")
		.select("event_id, event_name, image")
		.eq("event_id", eventId)
		.single();

	if (dbError || !event) {
		console.error(`❌ Event NOT found in database`);
		console.error(`   Error: ${dbError?.message || "Not found"}`);
		console.log(`\n   Trying case-insensitive search...`);
		
		// Try case-insensitive
		const { data: allEvents } = await supabase
			.from("events")
			.select("event_id, event_name")
			.ilike("event_id", eventId)
			.limit(5);
		
		if (allEvents && allEvents.length > 0) {
			console.log(`   Found similar event IDs:`);
			allEvents.forEach((e: any) => {
				console.log(`   - ${e.event_id} (${e.event_name})`);
			});
		}
		return;
	}

	const eventData = event as { event_id: string; event_name: string; image: string | null };
	
	console.log(`✅ Event found: ${eventData.event_name}`);
	console.log(`   Event ID: ${eventData.event_id}`);
	console.log(`   Image column: ${eventData.image || "(null)"}`);
	console.log(`   Has image: ${!!eventData.image}`);

	if (!eventData.image) {
		console.log(`\n⚠️  No image in database! Run sync script:`);
		console.log(`   npm run sync-event-images`);
		return;
	}

	// Step 2: Check storage
	console.log("\n2️⃣ STORAGE CHECK");
	console.log("-".repeat(60));
	
	// List all files that might match
	const { data: allFiles, error: listError } = await supabase.storage
		.from("images")
		.list("events");

	if (listError) {
		console.error(`❌ Error listing storage:`, listError.message);
		return;
	}

	const matchingFiles = allFiles?.filter(f => {
		const nameWithoutExt = f.name?.replace(/\.(webp|jpg|jpeg|png|gif)$/i, "");
		return nameWithoutExt?.toLowerCase() === eventId.toLowerCase();
	}) || [];

	console.log(`   Total files in storage: ${allFiles?.length || 0}`);
	console.log(`   Files matching event ID: ${matchingFiles.length}`);

	if (matchingFiles.length === 0) {
		console.log(`\n⚠️  No matching file found in storage!`);
		console.log(`   Looking for: ${eventId}.*`);
		console.log(`\n   Available files (first 10):`);
		allFiles?.slice(0, 10).forEach(f => {
			const nameWithoutExt = f.name?.replace(/\.(webp|jpg|jpeg|png|gif)$/i, "");
			console.log(`   - ${f.name} (ID: ${nameWithoutExt})`);
		});
		return;
	}

	matchingFiles.forEach(f => {
		console.log(`   ✅ Found: ${f.name}`);
	});

	// Step 3: Verify path matches
	console.log("\n3️⃣ PATH VERIFICATION");
	console.log("-".repeat(60));
	const expectedPath = `events/${matchingFiles[0].name}`;
	const actualPath = eventData.image;
	console.log(`   Expected path: ${expectedPath}`);
	console.log(`   Database path: ${actualPath}`);
	console.log(`   Match: ${expectedPath === actualPath ? "✅" : "❌"}`);

	if (expectedPath !== actualPath) {
		console.log(`\n⚠️  Path mismatch! Database has: "${actualPath}"`);
		console.log(`   But storage file is: "${expectedPath}"`);
		console.log(`\n   Fix by updating database:`);
		console.log(`   UPDATE events SET image = '${expectedPath}' WHERE event_id = '${eventId}';`);
	}

	// Step 4: URL generation
	console.log("\n4️⃣ URL GENERATION");
	console.log("-".repeat(60));
	const generatedUrl = getStorageImageUrl(eventData.image);
	console.log(`   Input path: ${eventData.image}`);
	console.log(`   Generated URL: ${generatedUrl || "(null)"}`);

	if (!generatedUrl) {
		console.error(`\n❌ Failed to generate URL!`);
		console.log(`   Check NEXT_PUBLIC_SUPABASE_URL environment variable`);
		return;
	}

	// Step 5: Test URL
	console.log("\n5️⃣ URL ACCESSIBILITY");
	console.log("-".repeat(60));
	try {
		const response = await fetch(generatedUrl, { method: "HEAD" });
		console.log(`   Status: ${response.status} ${response.statusText}`);
		if (response.ok) {
			console.log(`   ✅ URL is accessible!`);
			console.log(`   Content-Type: ${response.headers.get("content-type")}`);
		} else {
			console.log(`   ⚠️  URL returned ${response.status}`);
		}
	} catch (error: any) {
		console.error(`   ❌ Error: ${error.message}`);
	}

	// Final summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 SUMMARY");
	console.log("=".repeat(60));
	if (eventData.image && matchingFiles.length > 0 && expectedPath === actualPath && generatedUrl) {
		console.log("✅ All checks passed! Image should display correctly.");
	} else {
		console.log("⚠️  Issues found - see details above");
	}
	console.log("=".repeat(60));
}

const eventId = process.argv[2];
if (!eventId) {
	console.error("❌ Please provide an event ID");
	console.log("\nUsage: tsx scripts/verify-event-image.ts <event_id>");
	console.log("Example: tsx scripts/verify-event-image.ts 845e9bbebc7d41b39b5f77a6dd7bd022_spp");
	process.exit(1);
}

verifyEventImage(eventId).catch(console.error);

