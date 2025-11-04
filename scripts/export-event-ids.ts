/**
 * Script to export all event IDs and names
 * 
 * Usage:
 *   npm run export-events
 *   OR
 *   npx tsx scripts/export-event-ids.ts
 *   OR
 *   node --loader tsx scripts/export-event-ids.ts
 * 
 * Optional: Filter by sport type
 *   npm run export-events formula1
 * 
 * This will fetch all events from the XS2 API and export them to:
 * - events.json (full event data)
 * - events.csv (ID and name for easy reference)
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const XS2_API_KEY = process.env.XS2_API_KEY;
const BASE_URL = "https://api.xs2event.com/v1";

interface Event {
	event_id: string;
	event_name?: string;
	name?: string;
	official_name?: string;
	sport_type?: string;
	venue_name?: string;
	date_start?: string;
}

async function fetchAllEvents(sportType?: string): Promise<Event[]> {
	const allEvents: Event[] = [];
	let page = 1;
	const pageSize = 100;
	let hasMore = true;

	console.log(`Fetching events${sportType ? ` for ${sportType}` : ""}...`);

	while (hasMore && page <= 100) {
		// Safety limit: max 100 pages (10,000 events)
		const params = new URLSearchParams({
			page_size: String(pageSize),
			page: String(page),
		});

		if (sportType) {
			params.set("sport_type", sportType);
		}

		try {
			const url = `${BASE_URL}/events?${params.toString()}`;
			console.log(`Fetching page ${page}...`);

			const response = await fetch(url, {
				headers: {
					Accept: "application/json",
					"X-Api-Key": XS2_API_KEY as string,
				},
			});

			if (!response.ok) {
				console.error(`Error fetching page ${page}: ${response.status} ${response.statusText}`);
				break;
			}

			const data = await response.json();
			const events = data.events ?? data.results ?? data.items ?? [];

			if (events.length === 0) {
				hasMore = false;
				break;
			}

			allEvents.push(...events);
			console.log(`  Fetched ${events.length} events (total: ${allEvents.length})`);

			// Check pagination
			const pagination = data.pagination;
			if (pagination?.next_page) {
				// Follow next_page link if available
				page++;
			} else if (pagination?.page_number && events.length < pageSize) {
				// Last page if we got fewer events than page size
				hasMore = false;
			} else {
				page++;
			}
		} catch (error) {
			console.error(`Error on page ${page}:`, error);
			break;
		}
	}

	return allEvents;
}

function exportToJSON(events: Event[], filename: string) {
	const outputPath = join(process.cwd(), filename);
	writeFileSync(outputPath, JSON.stringify(events, null, 2), "utf-8");
	console.log(`\n✅ Exported ${events.length} events to ${filename}`);
}

function exportToCSV(events: Event[], filename: string) {
	const headers = ["Event ID", "Event Name", "Sport Type", "Venue", "Date Start"];
	const rows = events.map((event) => {
		const name = event.event_name || event.name || event.official_name || "Unknown";
		const id = event.event_id || "Unknown";
		const sport = event.sport_type || "";
		const venue = event.venue_name || "";
		const date = event.date_start || "";

		// Escape commas and quotes in CSV
		const escapeCSV = (str: string) => {
			if (str.includes(",") || str.includes('"') || str.includes("\n")) {
				return `"${str.replace(/"/g, '""')}"`;
			}
			return str;
		};

		return [
			escapeCSV(id),
			escapeCSV(name),
			escapeCSV(sport),
			escapeCSV(venue),
			escapeCSV(date),
		].join(",");
	});

	const csv = [headers.join(","), ...rows].join("\n");
	const outputPath = join(process.cwd(), filename);
	writeFileSync(outputPath, csv, "utf-8");
	console.log(`✅ Exported ${events.length} events to ${filename}`);
}

async function main() {
	if (!XS2_API_KEY) {
		console.error("❌ XS2_API_KEY environment variable is not set");
		console.error("Set it in your .env.local file");
		process.exit(1);
	}

	const sportType = process.argv[2]; // Optional: filter by sport type

	console.log("🚀 Starting event export...\n");

	try {
		const events = await fetchAllEvents(sportType);

		if (events.length === 0) {
			console.log("❌ No events found");
			return;
		}

		console.log(`\n📊 Found ${events.length} total events`);

		// Export to JSON
		const jsonFilename = sportType
			? `events-${sportType}.json`
			: "events.json";
		exportToJSON(events, jsonFilename);

		// Export to CSV for easy viewing
		const csvFilename = sportType
			? `events-${sportType}.csv`
			: "events.csv";
		exportToCSV(events, csvFilename);

		// Show summary by sport
		const bySport = new Map<string, number>();
		events.forEach((event) => {
			const sport = event.sport_type || "unknown";
			bySport.set(sport, (bySport.get(sport) || 0) + 1);
		});

		console.log("\n📈 Events by sport:");
		Array.from(bySport.entries())
			.sort((a, b) => b[1] - a[1])
			.forEach(([sport, count]) => {
				console.log(`  ${sport}: ${count}`);
			});

		console.log("\n✅ Export complete!");
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

main();

