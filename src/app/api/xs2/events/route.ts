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
		const { data, error } = await supabase
			.from("events")
			.select("*")
			.eq("event_id", eventId)
			.single();
		
		if (error || !data) {
			throw new Error(JSON.stringify({
				error: "Event not found",
				status: 404,
				details: error?.message || "Event not found",
			}));
		}
		
		return { results: [data], events: [data], items: [data], status: 200 };
	}
	
	// Build query for list of events
	let query = supabase.from("events").select("*");
	
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
		query = query.eq("is_popular", true);
	}
	
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
		events: data || [],
		results: data || [],
		items: data || [],
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
	
	// Create stable cache key from query parameters
	const sortedParams = Array.from(passthrough.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `${k}=${v}`)
		.join("&");
	const cacheKey = `events-${eventId || sortedParams || "all"}`;
	
	// Cache events for 24 hours (86400 seconds)
	const getCachedEvents = unstable_cache(
		async () => {
			const paramsCopy = new URLSearchParams(passthrough);
			return await fetchEventsFromDB(eventId, paramsCopy, origin);
		},
		[cacheKey],
		{
			revalidate: 86400, // 24 hours
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


