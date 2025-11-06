import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { unstable_cache } from "next/cache";

// Helper function to parse date filter (e.g., "ge:2024-01-01" -> { operator: "gte", value: "2024-01-01" })
function parseDateFilter(dateFilter: string): { operator: string; value: string } | null {
	if (!dateFilter) return null;
	
	const match = dateFilter.match(/^(ge|gt|le|lt|eq):(.+)$/);
	if (match) {
		const [, op, value] = match;
		const operatorMap: Record<string, string> = {
			ge: "gte",
			gt: "gt",
			le: "lte",
			lt: "lt",
			eq: "eq",
		};
		return { operator: operatorMap[op] || op, value };
	}
	
	// If no operator, default to "gte"
	return { operator: "gte", value: dateFilter };
}

async function fetchEventsFromDB(
	eventId: string | null,
	searchParams: URLSearchParams,
	origin: string | null
) {
	const today = new Date().toISOString().split("T")[0];
	const supabase = getSupabaseAdmin();
	
	// Handle single event request
	if (eventId) {
		// Explicitly select all columns including image to ensure it's returned
		// Using explicit column list to ensure PostgREST includes the image column
		// Using single-line format to avoid potential parsing issues with multiline strings
		const { data, error } = await supabase
			.from("events")
			.select("event_id,event_name,date_start,date_stop,event_status,tournament_id,tournament_name,venue_id,venue_name,location_id,city,iso_country,latitude,longitude,sport_type,season,tournament_type,date_confirmed,date_start_main_event,date_stop_main_event,hometeam_id,hometeam_name,visiting_id,visiting_name,created,updated,event_description,min_ticket_price_eur,max_ticket_price_eur,slug,number_of_tickets,sales_periods,is_popular,created_at,updated_at,image")
			.eq("event_id", eventId)
			.single();
		
		if (error || !data) {
			throw new Error(JSON.stringify({
				error: "Event not found",
				status: 404,
				details: error?.message || "Event not found",
			}));
		}
		
		// Debug: Log image column for single event requests
		// Always log in development to see what's happening
		const eventData = data as any;
		console.log("🔍 [API] Single event fetched from Supabase:", {
			eventId,
			eventName: eventData.event_name,
			hasImage: "image" in eventData,
			imageValue: eventData.image,
			imageType: typeof eventData.image,
			allKeys: Object.keys(eventData),
			allKeysCount: Object.keys(eventData).length,
		});
		console.log("🔍 [API] Raw data.image value:", eventData.image);
		console.log("🔍 [API] Keys include 'image':", Object.keys(eventData).includes("image"));
		
		// Ensure image is included in response (even if null)
		// Explicitly construct the response to guarantee image field is present
		const responseData: any = { ...(data as any) };
		if (!("image" in responseData)) {
			console.warn("⚠️ [API] Image field missing from Supabase response, adding null");
			responseData.image = null;
		}
		console.log("🔍 [API] Response data before return:", {
			hasImage: "image" in responseData,
			imageValue: responseData.image,
			keysCount: Object.keys(responseData).length,
		});
		
		return { results: [responseData], events: [responseData], items: [responseData], status: 200 };
	}
	
	// Build query for list of events
	// Select only fields needed by homepage/components to reduce payload
	let query = supabase
		.from("events")
		.select(
			"event_id,event_name,date_start,date_stop,date_start_main_event,date_stop_main_event,event_status,tournament_id,iso_country,city,sport_type,is_popular,min_ticket_price_eur,number_of_tickets,image"
		);
	
	// Debug: Log column names from first event (development only)
	if (process.env.NODE_ENV === "development") {
		const { data: sample } = await supabase
			.from("events")
			.select("event_id, image")
			.limit(1)
			.single();
		if (sample) {
			const sampleData = sample as any;
			console.log("[API] Sample event columns:", {
				hasImage: "image" in sampleData,
				imageValue: sampleData.image,
				allKeys: Object.keys(sampleData),
			});
		}
	}
	
	// Extract and apply filters
	const sportType = searchParams.get("sport_type");
	const tournamentId = searchParams.get("tournament_id");
	const teamId = searchParams.get("team_id") || searchParams.get("team");
	const country = searchParams.get("country");
	const eventName = searchParams.get("event_name");
	const queryText = searchParams.get("query");
	const isPopular = searchParams.get("is_popular");
	const dateStop = searchParams.get("date_stop");
	const page = parseInt(searchParams.get("page") || searchParams.get("page_number") || "1");
	const pageSize = parseInt(searchParams.get("page_size") || "50");
	const eventStatus = searchParams.get("event_status");
	const excludeStatus = searchParams.get("exclude_status"); // comma-separated
	
	// Apply filters
	if (sportType) {
		query = query.eq("sport_type", sportType);
	}
	if (tournamentId) {
		query = query.eq("tournament_id", tournamentId);
	}
	if (teamId) {
		query = query.or(`hometeam_id.eq.${teamId},visiting_id.eq.${teamId}`);
	}
	if (country) {
		query = query.eq("iso_country", country);
	}
	if (eventName) {
		query = query.ilike("event_name", `%${eventName}%`);
	}
	if (queryText) {
		// Text search on event_name
		query = query.ilike("event_name", `%${queryText}%`);
	}
	if (isPopular === "true") {
		// Strict: must be exactly true (not null, not false)
		query = query.eq("is_popular", true);
	}
	if (eventStatus) {
		// Use case-insensitive exact match for status
		// ilike with exact string (no %) does case-insensitive exact match
		query = query.ilike("event_status", eventStatus);
	}
	// Note: excludeStatus will be handled client-side after fetch for case-insensitive matching
	
	// Handle date_stop filter (with operators like "ge:", "gt:", etc.)
	if (dateStop) {
		const dateFilter = parseDateFilter(dateStop);
		if (dateFilter) {
			if (dateFilter.operator === "gte") {
				query = query.gte("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "gt") {
				query = query.gt("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "lte") {
				query = query.lte("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "lt") {
				query = query.lt("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "eq") {
				query = query.eq("date_stop", dateFilter.value);
			}
		}
	} else if (origin !== "allevents" && sportType) {
		// Default: only show future events if sport_type is provided and not showing all events
		query = query.gte("date_stop", today);
	}
	
	// Order by date_start ascending (upcoming events first)
	query = query.order("date_start", { ascending: true, nullsFirst: false });
	
	// Apply pagination
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;
	query = query.range(from, to);
	
	const { data, error } = await query;
	
	if (error) {
		throw new Error(JSON.stringify({
			error: "Failed to fetch events",
			status: 500,
			details: error.message,
		}));
	}
	
	// Apply case-insensitive excludeStatus filter client-side
	let filteredData = data || [];
	
	// Also apply strict client-side filtering for is_popular and event_status
	// This ensures we catch any events that slipped through server-side filters
	if (isPopular === "true" || eventStatus || excludeStatus) {
		const beforeCount = filteredData.length;
		filteredData = filteredData.filter((item: any) => {
			// Strict is_popular check
			if (isPopular === "true" && item.is_popular !== true) {
				return false;
			}
			// Strict event_status check
			if (eventStatus) {
				const itemStatus = String(item.event_status || "").toLowerCase().trim();
				const expectedStatus = String(eventStatus).toLowerCase().trim();
				if (itemStatus !== expectedStatus) {
					return false;
				}
			}
			// Exclude statuses
			if (excludeStatus) {
				const excludedStatuses = excludeStatus.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
				const itemStatus = String(item.event_status || "").toLowerCase().trim();
				if (excludedStatuses.includes(itemStatus)) {
					return false;
				}
			}
			return true;
		});
		
		if (process.env.NODE_ENV === "development") {
			const excludedCount = beforeCount - filteredData.length;
			if (excludedCount > 0) {
				console.log(`[API] Client-side filtering excluded ${excludedCount} events (was ${beforeCount}, now ${filteredData.length})`);
			}
		}
	}
	
	// Debug logging for hero carousel requests
	if (process.env.NODE_ENV === "development" && isPopular === "true" && eventStatus) {
		console.log(`[API] Hero carousel filter - is_popular=${isPopular}, event_status=${eventStatus}, exclude_status=${excludeStatus}`);
		console.log(`[API] Raw DB results: ${data?.length || 0}, After filtering: ${filteredData.length}`);
		if (filteredData.length > 0) {
			console.log(`[API] ✅ Filtered events (first 5):`, filteredData.slice(0, 5).map((e: any) => ({
				id: e.event_id,
				name: e.event_name,
				status: e.event_status,
				is_popular: e.is_popular,
				date_start: e.date_start,
			})));
		} else if (data && data.length > 0) {
			console.log(`[API] ❌ All events were filtered out. Sample of rejected events:`, data.slice(0, 3).map((e: any) => ({
				id: e.event_id,
				name: e.event_name,
				status: e.event_status,
				is_popular: e.is_popular,
				date_start: e.date_start,
			})));
		}
	}
	
	// Get total count for pagination (with same filters)
	let countQuery = supabase.from("events").select("*", { count: "exact", head: true });
	
	if (sportType) countQuery = countQuery.eq("sport_type", sportType);
	if (tournamentId) countQuery = countQuery.eq("tournament_id", tournamentId);
	if (teamId) countQuery = countQuery.or(`hometeam_id.eq.${teamId},visiting_id.eq.${teamId}`);
	if (country) countQuery = countQuery.eq("iso_country", country);
	if (eventName) countQuery = countQuery.ilike("event_name", `%${eventName}%`);
	if (queryText) countQuery = countQuery.ilike("event_name", `%${queryText}%`);
	if (isPopular === "true") countQuery = countQuery.eq("is_popular", true);
	
	if (dateStop) {
		const dateFilter = parseDateFilter(dateStop);
		if (dateFilter) {
			if (dateFilter.operator === "gte") {
				countQuery = countQuery.gte("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "gt") {
				countQuery = countQuery.gt("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "lte") {
				countQuery = countQuery.lte("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "lt") {
				countQuery = countQuery.lt("date_stop", dateFilter.value);
			} else if (dateFilter.operator === "eq") {
				countQuery = countQuery.eq("date_stop", dateFilter.value);
			}
		}
	} else if (origin !== "allevents" && sportType) {
		countQuery = countQuery.gte("date_stop", today);
	}
	
	const { count: totalCount } = await countQuery;
	
	// Return in XS2-compatible format
	return {
		events: filteredData,
		results: filteredData,
		items: filteredData,
		pagination: {
			page,
			page_size: pageSize,
			total: totalCount || 0,
			total_pages: Math.ceil((totalCount || 0) / pageSize),
			next_page: page * pageSize < (totalCount || 0) ? page + 1 : null,
			prev_page: page > 1 ? page - 1 : null,
		},
		status: 200,
	};
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const eventId = searchParams.get("id") || searchParams.get("event_id");
	const origin = searchParams.get("origin");
	const passthrough = new URLSearchParams(searchParams);
	
	// Remove origin parameter (internal only)
	passthrough.delete("origin");
	
	// Convert 'team' parameter to 'team_id' if needed
	if (passthrough.has("team") && !passthrough.has("team_id")) {
		passthrough.set("team_id", passthrough.get("team") || "");
		passthrough.delete("team");
	}
	
	// Convert 'page_number' to 'page'
	if (passthrough.has("page_number") && !passthrough.has("page")) {
		passthrough.set("page", passthrough.get("page_number") || "1");
		passthrough.delete("page_number");
	}
	
	// For single event requests, bypass cache to ensure fresh data with image column
	// For list requests, use cache but with shorter revalidation
	if (eventId) {
		console.log("🔍 [API] Route handler called for eventId:", eventId);
		try {
			const paramsCopy = new URLSearchParams(passthrough);
			const result = await fetchEventsFromDB(eventId, paramsCopy, origin);
			
			// Log what we're about to return
			console.log("🔍 [API] About to return response:", {
				resultsCount: result.results?.length || 0,
				firstEventHasImage: result.results?.[0] ? "image" in result.results[0] : false,
				firstEventImageValue: result.results?.[0]?.image,
				firstEventKeysCount: result.results?.[0] ? Object.keys(result.results[0]).length : 0,
			});
			
			// Ensure image field is explicitly included in JSON response
			const response = Response.json(result, { 
				status: result.status || 200,
				headers: {
					'Cache-Control': 'no-store, no-cache, must-revalidate',
				}
			});
			
			return response;
		} catch (error: any) {
			let errorData;
			try {
				errorData = JSON.parse(error.message);
			} catch {
				errorData = { error: error.message || "Failed to fetch event" };
			}
			return Response.json(
				{
					...errorData,
					events: [],
					results: [],
					items: [],
				},
				{ status: errorData.status || 500 }
			);
		}
	}

	// Check if cache should be bypassed (for hero carousel or other fresh data requests)
	const bypassCache = passthrough.get("no_cache") === "true" || passthrough.get("fresh") === "true";
	
	// Create stable cache key from query parameters for list requests
	// Add version "v2" to force cache invalidation after adding image column
	const sortedParams = Array.from(passthrough.entries())
		.filter(([k]) => k !== "no_cache" && k !== "fresh") // Exclude cache-busting params from cache key
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `${k}=${v}`)
		.join("&");
	const cacheKey = `events-v2-${sortedParams || "all"}`;
	
	// If cache should be bypassed, fetch directly without caching
	if (bypassCache) {
		try {
			const paramsCopy = new URLSearchParams(passthrough);
			paramsCopy.delete("no_cache");
			paramsCopy.delete("fresh");
			const result = await fetchEventsFromDB(null, paramsCopy, origin);
			return Response.json(result, { 
				status: result.status || 200,
				headers: {
					'Cache-Control': 'no-store, no-cache, must-revalidate',
				}
			});
		} catch (error: any) {
			let errorData;
			try {
				errorData = JSON.parse(error.message);
			} catch {
				errorData = { error: error.message || "Failed to fetch events" };
			}
			return Response.json(
				{
					...errorData,
					events: [],
					results: [],
					items: [],
				},
				{ status: errorData.status || 500 }
			);
		}
	}
	
	// Cache list requests for 1 hour (3600 seconds) - shorter for faster updates
	const getCachedEvents = unstable_cache(
		async () => {
			const paramsCopy = new URLSearchParams(passthrough);
			paramsCopy.delete("no_cache");
			paramsCopy.delete("fresh");
			return await fetchEventsFromDB(null, paramsCopy, origin);
		},
		[cacheKey],
		{
			revalidate: 3600, // 1 hour (reduced from 24 hours)
			tags: ["events"],
		}
	);

	try {
		const result = await getCachedEvents();
		return Response.json(result, { status: result.status || 200 });
	} catch (error: any) {
		let errorData;
		try {
			errorData = JSON.parse(error.message);
		} catch {
			errorData = { error: error.message || "Failed to fetch events" };
		}
		return Response.json(
			{
				...errorData,
				events: [],
				results: [],
				items: [],
			},
			{ status: errorData.status || 500 }
		);
	}
}


