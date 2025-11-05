import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface SyncResult {
	table: string;
	inserted: number;
	updated: number;
	errors: number;
	errorMessages?: string[];
}

// Fetch all pages from XS2 API with pagination support
async function fetchAllPages<T>(
	apiKey: string,
	endpoint: string,
	itemKey: string = "results",
	pageSize: number = 100
): Promise<T[]> {
	const allItems: T[] = [];
	let page = 1;
	let hasMore = true;
	// Use same base URL pattern as Next.js code
	const baseUrl = Deno.env.get("XS2_API_BASE") || "https://api.xs2event.com/v1";

	while (hasMore && page <= 1000) {
		// Safety limit: max 1000 pages
		const params = new URLSearchParams({
			page_size: String(pageSize),
			page: String(page),
		});

		try {
			const response = await fetch(`${baseUrl}/${endpoint}?${params.toString()}`, {
				headers: {
					Accept: "application/json",
					"X-Api-Key": apiKey,
				},
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`XS2 API error ${response.status}: ${text}`);
			}

			const data = await response.json();
			const items: T[] = data[itemKey] ?? data.results ?? data.items ?? [];

			if (items.length === 0) {
				hasMore = false;
				break;
			}

			allItems.push(...items);

			// Check pagination
			const pagination = data.pagination;
			if (pagination?.next_page) {
				page++;
			} else if (pagination?.page_number && items.length < pageSize) {
				hasMore = false;
			} else {
				page++;
			}

			// Reduced delay to speed up (Edge Functions have time limits)
			// Only delay if we have more pages to fetch
			if (hasMore && page < 1000) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
		} catch (error: any) {
			console.error(`Error fetching page ${page} of ${endpoint}:`, error.message);
			hasMore = false;
			break;
		}
	}

	return allItems;
}

// Batch upsert helper - much faster than individual upserts
async function batchUpsert(
	supabase: any,
	table: string,
	items: any[],
	onConflict: string,
	batchSize: number = 500  // Smaller batches for Edge Functions
): Promise<{ inserted: number; errors: number; errorMessages: string[] }> {
	let inserted = 0;
	let errors = 0;
	const errorMessages: string[] = [];

	if (items.length === 0) {
		return { inserted: 0, errors: 0, errorMessages: [] };
	}

	// Process in batches to avoid memory issues and timeouts
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		try {
			const { error } = await supabase
				.from(table)
				.upsert(batch, { onConflict });
			
			if (error) {
				errors += batch.length;
				errorMessages.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
			} else {
				inserted += batch.length;
			}
		} catch (err: any) {
			errors += batch.length;
			errorMessages.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err.message}`);
		}
	}

	return { inserted, errors, errorMessages };
}

// Sync functions for each table
async function syncSports(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "sports", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "sports", "sports");
		
		// Batch upsert all items at once
		const batchResult = await batchUpsert(
			supabase,
			"sports",
			items.map(item => ({ sport_id: item.sport_id })),
			"sport_id",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

async function syncCountries(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "countries", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "countries", "countries");
		
		const batchResult = await batchUpsert(
			supabase,
			"countries",
			items.map(item => ({ country: item.country })),
			"country",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

async function syncCities(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "cities", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "cities", "cities");
		
		const batchResult = await batchUpsert(
			supabase,
			"cities",
			items.map(item => ({ city: item.city, country: item.country })),
			"city,country",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

async function syncVenues(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "venues", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "venues", "venues");
		
		const batchResult = await batchUpsert(
			supabase,
			"venues",
			items.map(item => ({
				venue_id: item.venue_id,
				official_name: item.official_name,
				country: item.country,
				popular_stadium: item.popular_stadium,
				venue_type: item.venue_type,
				capacity: item.capacity,
				city: item.city,
				province: item.province,
				latitude: item.latitude,
				longitude: item.longitude,
				number: item.number,
				postalcode: item.postalcode,
				streetname: item.streetname,
				opened: item.opened,
				track_length: item.track_length,
				wikipedia_slug: item.wikipedia_slug,
				wikipedia_snippet: item.wikipedia_snippet,
				slug: item.slug,
			})),
			"venue_id",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

async function syncTeams(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "teams", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "teams", "teams");
		
		const batchResult = await batchUpsert(
			supabase,
			"teams",
			items.map(item => ({
				team_id: item.team_id,
				official_name: item.official_name,
				popular_team: item.popular_team,
				sport_type: item.sport_type,
				slug: item.slug,
				iso_country: item.iso_country,
				wikipedia_slug: item.wikipedia_slug,
				wikipedia_snippet: item.wikipedia_snippet,
				venue_id: item.venue_id,
				team_slug: item.team_slug,
				logo_filename: item.logo_filename,
				colors_svg: item.colors_svg,
			})),
			"team_id",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

async function syncTournaments(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "tournaments", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "tournaments", "tournaments");
		
		const batchResult = await batchUpsert(
			supabase,
			"tournaments",
			items.map(item => ({
				tournament_id: item.tournament_id,
				official_name: item.official_name,
				season: item.season,
				tournament_type: item.tournament_type,
				region: item.region,
				sport_type: item.sport_type,
				date_start: item.date_start,
				date_stop: item.date_stop,
				slug: item.slug,
				number_events: item.number_events,
				created: item.created,
				updated: item.updated,
			})),
			"tournament_id",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

async function syncEvents(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "events", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "events", "events");
		
		const batchResult = await batchUpsert(
			supabase,
			"events",
			items.map(item => ({
				event_id: item.event_id,
				event_name: item.event_name,
				date_start: item.date_start,
				date_stop: item.date_stop,
				event_status: item.event_status,
				tournament_id: item.tournament_id,
				tournament_name: item.tournament_name,
				venue_id: item.venue_id,
				venue_name: item.venue_name,
				location_id: item.location_id,
				city: item.city,
				iso_country: item.iso_country,
				latitude: item.latitude,
				longitude: item.longitude,
				sport_type: item.sport_type,
				season: item.season,
				tournament_type: item.tournament_type,
				date_confirmed: item.date_confirmed,
				date_start_main_event: item.date_start_main_event,
				date_stop_main_event: item.date_stop_main_event,
				hometeam_id: item.hometeam_id,
				hometeam_name: item.hometeam_name,
				visiting_id: item.visiting_id,
				visiting_name: item.visiting_name,
				created: item.created,
				updated: item.updated,
				event_description: item.event_description,
				min_ticket_price_eur: item.min_ticket_price_eur,
				max_ticket_price_eur: item.max_ticket_price_eur,
				slug: item.slug,
				number_of_tickets: item.number_of_tickets,
				sales_periods: item.sales_periods,
				is_popular: item.is_popular,
			})),
			"event_id",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

async function syncCategories(supabase: any, apiKey: string): Promise<SyncResult> {
	const result: SyncResult = { table: "categories", inserted: 0, updated: 0, errors: 0, errorMessages: [] };

	try {
		const items = await fetchAllPages<any>(apiKey, "categories", "categories");
		
		const batchResult = await batchUpsert(
			supabase,
			"categories",
			items.map(item => ({
				category_id: item.category_id,
				category_name: item.category_name,
				venue_id: item.venue_id,
				sport_type: item.sport_type,
				venue_name: item.venue_name,
				created: item.created,
				on_svg: item.on_svg,
				description: item.description,
				options: item.options,
				category_type: item.category_type,
				ticket_delivery_days: item.ticket_delivery_days,
				party_size_together: item.party_size_together,
				distribution_channel: item.distribution_channel,
				highlight_type: item.highlight_type,
				files: item.files,
				sports_enabled: item.sports_enabled,
				sports_disabled: item.sports_disabled,
			})),
			"category_id",
			500
		);
		
		result.inserted = batchResult.inserted;
		result.errors = batchResult.errors;
		result.errorMessages = batchResult.errorMessages;
		result.updated = result.inserted;
	} catch (error: any) {
		result.errors++;
		result.errorMessages?.push(`Fetch error: ${error.message}`);
	}

	return result;
}

Deno.serve(async (req) => {
	try {
		// Get environment variables
		// Supabase Edge Functions automatically provide SUPABASE_URL and SUPABASE_ANON_KEY
		// But we need the service role key for admin operations
		const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		const xs2ApiKey = Deno.env.get("XS2_API_KEY");

		if (!supabaseUrl || !supabaseServiceKey || !xs2ApiKey) {
			const missing = [];
			if (!supabaseUrl) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
			if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
			if (!xs2ApiKey) missing.push("XS2_API_KEY");
			
			return new Response(
				JSON.stringify({ 
					error: "Missing required environment variables",
					missing: missing
				}),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		// Create Supabase client with service role key (same as getSupabaseAdmin in Next.js)
		const supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				persistSession: false,
			},
		});

		// Parse request
		const url = new URL(req.url);
		const table = url.searchParams.get("table");
		const startTime = Date.now();

		let results: SyncResult[];

		if (table) {
			// Sync specific table
			console.log(`[XS2 Sync] Syncing table: ${table}`);

			switch (table.toLowerCase()) {
				case "sports":
					results = [await syncSports(supabase, xs2ApiKey)];
					break;
				case "countries":
					results = [await syncCountries(supabase, xs2ApiKey)];
					break;
				case "cities":
					results = [await syncCities(supabase, xs2ApiKey)];
					break;
				case "venues":
					results = [await syncVenues(supabase, xs2ApiKey)];
					break;
				case "teams":
					results = [await syncTeams(supabase, xs2ApiKey)];
					break;
				case "tournaments":
					results = [await syncTournaments(supabase, xs2ApiKey)];
					break;
				case "events":
					results = [await syncEvents(supabase, xs2ApiKey)];
					break;
				case "categories":
					results = [await syncCategories(supabase, xs2ApiKey)];
					break;
				default:
					return new Response(
						JSON.stringify({ error: `Unknown table: ${table}` }),
						{ status: 400, headers: { "Content-Type": "application/json" } }
					);
			}
		} else {
			// Sync all tables sequentially
			// Note: Syncing all tables may take longer than Edge Function timeout limits
			// Consider syncing tables individually or using a queue system
			console.log("[XS2 Sync] Syncing all tables...");
			results = [];
			
			// Sync in dependency order (parents first)
			try {
				results.push(await syncSports(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "sports", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
			
			try {
				results.push(await syncCountries(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "countries", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
			
			try {
				results.push(await syncCities(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "cities", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
			
			try {
				results.push(await syncVenues(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "venues", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
			
			try {
				results.push(await syncTeams(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "teams", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
			
			try {
				results.push(await syncTournaments(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "tournaments", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
			
			try {
				results.push(await syncEvents(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "events", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
			
			try {
				results.push(await syncCategories(supabase, xs2ApiKey));
			} catch (e: any) {
				results.push({ table: "categories", inserted: 0, updated: 0, errors: 1, errorMessages: [e.message] });
			}
		}

		const duration = Date.now() - startTime;

		// Calculate totals
		const totals = results.reduce(
			(acc, r) => {
				acc.inserted += r.inserted;
				acc.updated += r.updated;
				acc.errors += r.errors;
				return acc;
			},
			{ inserted: 0, updated: 0, errors: 0 }
		);

		return new Response(
			JSON.stringify({
				success: true,
				duration: `${duration}ms`,
				totals,
				results,
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error: any) {
		console.error("[XS2 Sync] Error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message || "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
});

