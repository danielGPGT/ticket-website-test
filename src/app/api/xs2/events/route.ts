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
			"event_id,event_name,date_start,date_stop,date_start_main_event,date_stop_main_event,event_status,tournament_id,tournament_name,season,venue_id,venue_name,iso_country,city,sport_type,is_popular,min_ticket_price_eur,number_of_tickets,image"
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

	const sportTypes = searchParams.getAll("sport_type").filter((value) => Boolean(value));
	const tournamentIds = searchParams.getAll("tournament_id").filter((value) => Boolean(value));
	const teamId = searchParams.get("team_id") || searchParams.get("team");
	const countryCodes = searchParams.getAll("country").filter((value) => Boolean(value));
	const cityFilters = searchParams.getAll("city").filter((value) => Boolean(value));
	const venueFilters = searchParams.getAll("venue").filter((value) => Boolean(value));
	const eventName = searchParams.get("event_name") || searchParams.get("query");
	const isPopular = searchParams.get("is_popular") || searchParams.get("popular_events");
	const dateStartFilter = searchParams.get("date_start");
	const dateStopFilter = searchParams.get("date_stop");
	const priceMin = searchParams.get("price_min");
	const priceMax = searchParams.get("price_max");
	const includePast = searchParams.get("include_past") === "true";
	const page = parseInt(searchParams.get("page") || searchParams.get("page_number") || "1", 10);
	const pageSize = parseInt(searchParams.get("page_size") || "50", 10);
	const eventStatus = searchParams.get("event_status");
	const excludeStatus = searchParams.get("exclude_status");
	const stockStatuses = searchParams.getAll("stock_status").filter((value) => Boolean(value)).map((s) => s.toLowerCase());
	const includeFacets = searchParams.get("include_facets") === "true";
	
	const applyUpcomingConstraint = (builder: any) => {
		const todayIso = today;
		return builder.or(`date_stop.gte.${todayIso},and(date_stop.is.null,date_start.gte.${todayIso})`);
	};

	// Apply filters
	const applyFilters = (builder: any) => {
		let scoped = builder;
		if (sportTypes.length > 0) {
			scoped = scoped.in("sport_type", sportTypes.map((s) => s.toLowerCase()));
		}
		if (tournamentIds.length > 0) {
			scoped = scoped.in("tournament_id", tournamentIds);
		}
		if (teamId) {
			scoped = scoped.or(`hometeam_id.eq.${teamId},visiting_id.eq.${teamId}`);
		}
		if (countryCodes.length > 0) {
			scoped = scoped.in("iso_country", countryCodes.map((code) => code.toUpperCase()));
		}
		if (cityFilters.length > 0) {
			scoped = scoped.in("city", cityFilters);
		}
		if (venueFilters.length > 0) {
			scoped = scoped.in("venue_name", venueFilters);
		}
		if (eventName) {
			const likeValue = `%${eventName}%`;
			scoped = scoped.or(
				`event_name.ilike.${likeValue},venue_name.ilike.${likeValue},city.ilike.${likeValue},tournament_name.ilike.${likeValue}`
			);
		}
		if (isPopular === "true") {
			scoped = scoped.eq("is_popular", true);
		}
		if (eventStatus) {
			scoped = scoped.ilike("event_status", eventStatus);
		}
		if (priceMin) {
			const minValue = Number(priceMin);
			if (!Number.isNaN(minValue)) {
				scoped = scoped.gte("min_ticket_price_eur", minValue);
			}
		}
		if (priceMax) {
			const maxValue = Number(priceMax);
			if (!Number.isNaN(maxValue)) {
				scoped = scoped.lte("min_ticket_price_eur", maxValue);
			}
		}
		if (dateStartFilter) {
			const dateFilter = parseDateFilter(dateStartFilter);
			if (dateFilter) {
				if (dateFilter.operator === "gte") {
					scoped = scoped.gte("date_start", dateFilter.value);
				} else if (dateFilter.operator === "gt") {
					scoped = scoped.gt("date_start", dateFilter.value);
				} else if (dateFilter.operator === "lte") {
					scoped = scoped.lte("date_start", dateFilter.value);
				} else if (dateFilter.operator === "lt") {
					scoped = scoped.lt("date_start", dateFilter.value);
				} else if (dateFilter.operator === "eq") {
					scoped = scoped.eq("date_start", dateFilter.value);
				}
			}
		}
		if (dateStopFilter) {
			const dateFilter = parseDateFilter(dateStopFilter);
			if (dateFilter) {
				if (dateFilter.operator === "gte") {
					scoped = scoped.gte("date_stop", dateFilter.value);
				} else if (dateFilter.operator === "gt") {
					scoped = scoped.gt("date_stop", dateFilter.value);
				} else if (dateFilter.operator === "lte") {
					scoped = scoped.lte("date_stop", dateFilter.value);
				} else if (dateFilter.operator === "lt") {
					scoped = scoped.lt("date_stop", dateFilter.value);
				} else if (dateFilter.operator === "eq") {
					scoped = scoped.eq("date_stop", dateFilter.value);
				}
			}
		} else if (!includePast) {
			scoped = applyUpcomingConstraint(scoped);
		}

		return scoped;
	};

	query = applyFilters(query);
	
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

	// Also apply strict client-side filtering for flags that cannot be expressed via Supabase filters
	if (isPopular === "true" || eventStatus || excludeStatus || stockStatuses.length > 0) {
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

			if (stockStatuses.length > 0) {
				const itemStatus = String(item.event_status || "").toLowerCase().trim();
				const numberOfTickets = Number(item.number_of_tickets ?? 0);

				let derivedStatus = "coming_soon";
				if (itemStatus === "soldout" || itemStatus === "closed") {
					derivedStatus = "sales_closed";
				} else if (itemStatus === "cancelled" || itemStatus === "postponed") {
					derivedStatus = "not_confirmed";
				} else if (numberOfTickets > 0) {
					derivedStatus = "on_sale";
				} else {
					derivedStatus = "coming_soon";
				}

				if (!stockStatuses.includes(derivedStatus)) {
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
	countQuery = applyFilters(countQuery);
	const { count: totalCount } = await countQuery;

	const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));
	const nextPageParams = new URLSearchParams(searchParams);
	nextPageParams.delete("page_number");
	nextPageParams.set("page", String(page + 1));
	nextPageParams.set("include_facets", "false");
	const nextPageUrl = page < totalPages ? `/api/xs2/events?${nextPageParams.toString()}` : null;

	const prevPageParams = new URLSearchParams(searchParams);
	prevPageParams.delete("page_number");
	prevPageParams.set("page", String(page - 1));
	const prevPageUrl = page > 1 ? `/api/xs2/events?${prevPageParams.toString()}` : null;

	let facets: Record<string, any> | null = null;

	if (includeFacets) {
		const facetFields = "event_id,sport_type,tournament_id,tournament_name,season,iso_country,city,venue_name,event_status,number_of_tickets,min_ticket_price_eur,date_start,date_stop";
		const facetBatchSize = 1000;
		const maxFacetBatches = 100;
		const aggregatedRows: any[] = [];
		const totalFacetBatches = Math.min(
			totalCount ? Math.ceil(totalCount / facetBatchSize) : maxFacetBatches,
			maxFacetBatches
		);

		for (let batch = 0; batch < totalFacetBatches; batch++) {
			const fromFacet = batch * facetBatchSize;
			const toFacet = fromFacet + facetBatchSize - 1;
			const facetQuery = applyFilters(
				supabase
					.from("events")
					.select(facetFields)
					.order("event_id", { ascending: true })
			);
			const { data: facetData, error: facetError } = await facetQuery.range(fromFacet, toFacet);
			if (facetError) {
				console.error("[API] Facet batch error", facetError.message);
				break;
			}
			if (!facetData || facetData.length === 0) {
				break;
			}
			aggregatedRows.push(...facetData);
		}

		if (aggregatedRows.length > 0) {
			const sportsCount: Record<string, number> = {};
			const countryCount: Record<string, number> = {};
			const cityCount: Record<string, number> = {};
			const venueCount: Record<string, number> = {};
			const tournamentMap = new Map<string, { id: string; name: string; season?: string; count: number }>();
			const statusCount: Record<string, number> = {};
			const priceRanges = {
				"0-99": 0,
				"100-199": 0,
				"200-499": 0,
				"500-999": 0,
				"1000+": 0,
			};

			aggregatedRows.forEach((item) => {
				const sport = String(item.sport_type ?? "").toLowerCase();
				if (sport) sportsCount[sport] = (sportsCount[sport] ?? 0) + 1;

				const iso = String(item.iso_country ?? "").toUpperCase();
				if (iso) countryCount[iso] = (countryCount[iso] ?? 0) + 1;

				const city = String(item.city ?? "").trim();
				if (city) cityCount[city] = (cityCount[city] ?? 0) + 1;

				const venue = String(item.venue_name ?? "").trim();
				if (venue) venueCount[venue] = (venueCount[venue] ?? 0) + 1;

				const tId = String(item.tournament_id ?? "").trim();
				const tName = String(item.tournament_name ?? "").trim();
				let tSeason = item.season ? String(item.season) : "";
				if (!tSeason && item.date_start) {
					const date = new Date(item.date_start);
					if (!Number.isNaN(date.getTime())) {
						tSeason = String(date.getFullYear());
					}
				}
				if (tId) {
					const entry = tournamentMap.get(tId) ?? { id: tId, name: tName || tId, season: tSeason || undefined, count: 0 };
					entry.count += 1;
					if (tName) entry.name = tName;
					if (tSeason) entry.season = tSeason;
					tournamentMap.set(tId, entry);
				}

				const rawStatus = String(item.event_status ?? "").toLowerCase();
				const tickets = Number(item.number_of_tickets ?? 0);
				let derivedStatus = "coming_soon";
				if (rawStatus === "soldout" || rawStatus === "closed") {
					derivedStatus = "sales_closed";
				} else if (rawStatus === "cancelled" || rawStatus === "postponed") {
					derivedStatus = "not_confirmed";
				} else if (tickets > 0) {
					derivedStatus = "on_sale";
				}
				statusCount[derivedStatus] = (statusCount[derivedStatus] ?? 0) + 1;

				const price = Number(item.min_ticket_price_eur ?? 0);
				const priceEur = price > 1000 ? price / 100 : price;
				if (!Number.isNaN(priceEur) && priceEur > 0) {
					if (priceEur < 100) priceRanges["0-99"] += 1;
					else if (priceEur < 200) priceRanges["100-199"] += 1;
					else if (priceEur < 500) priceRanges["200-499"] += 1;
					else if (priceEur < 1000) priceRanges["500-999"] += 1;
					else priceRanges["1000+"] += 1;
				}
			});

			const tournamentIdsForDetails = Array.from(tournamentMap.keys());
			if (tournamentIdsForDetails.length > 0) {
				const detailChunkSize = 100;
				for (let i = 0; i < tournamentIdsForDetails.length; i += detailChunkSize) {
					const chunk = tournamentIdsForDetails.slice(i, i + detailChunkSize);
					const { data: details } = await supabase
						.from("tournaments")
						.select("tournament_id,official_name,season")
						.in("tournament_id", chunk);
					if (details) {
						details.forEach((detail: any) => {
							const entry = tournamentMap.get(String(detail.tournament_id ?? ""));
							if (!entry) return;
							if (detail.official_name) {
								entry.name = String(detail.official_name);
							}
							let season = detail.season ? String(detail.season) : "";
							if (!season && entry.season) {
								season = entry.season;
							}
							entry.season = season || undefined;
							const updated = tournamentMap.get(entry.id);
							if (updated) {
								updated.name = entry.name;
								updated.season = entry.season;
							}
						});
					}
				}
			}

			facets = {
				sports: sportsCount,
				countries: countryCount,
				cities: cityCount,
				venues: venueCount,
				tournaments: Array.from(tournamentMap.values()),
				statuses: statusCount,
				price_ranges: priceRanges,
			};
		}
	}

	// Return in XS2-compatible format
	return {
		events: filteredData,
		results: filteredData,
		items: filteredData,
		facets,
		pagination: {
			page,
			page_size: pageSize,
			total: totalCount || 0,
			total_pages: Math.ceil((totalCount || 0) / pageSize),
			next_page: nextPageUrl,
			prev_page: prevPageUrl,
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
	const cacheKey = `events-v5-${sortedParams || "all"}`;
	
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


