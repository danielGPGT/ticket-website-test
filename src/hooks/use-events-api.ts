import { useState, useCallback, useRef, useEffect } from "react";
import { normalizeToIso3 } from "@/lib/country-flags";
import type { FilterState } from "./use-filters";

type FetchOptions = {
	signal?: AbortSignal;
};

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(url: string): string {
	return url;
}

function getCached(url: string): any | null {
	const key = getCacheKey(url);
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.data;
	}
	if (cached) {
		cache.delete(key);
	}
	return null;
}

function setCached(url: string, data: any): void {
	const key = getCacheKey(url);
	cache.set(key, { data, timestamp: Date.now() });
}

// Helper function to fetch all pages for a single request
type FetchAllResult = {
	events: any[];
	facets: Record<string, any> | null;
};

function aggregateFacetsFromEvents(events: any[]): Record<string, any> {
	const sportsCount: Record<string, number> = {};
	const countryCount: Record<string, number> = {};
	const cityCount: Record<string, number> = {};
	const venueCount: Record<string, number> = {};
	const tournamentMap: Record<string, { id: string; name: string; count: number }> = {};
	const statusCount: Record<string, number> = {};
	const priceRanges = {
		"0-99": 0,
		"100-199": 0,
		"200-499": 0,
		"500-999": 0,
		"1000+": 0,
	};

	events.forEach((item) => {
		const sport = String(item.sport_type ?? "").toLowerCase();
		if (sport) sportsCount[sport] = (sportsCount[sport] ?? 0) + 1;

		const iso = String(item.iso_country ?? item.country ?? "").toUpperCase();
		if (iso) countryCount[iso] = (countryCount[iso] ?? 0) + 1;

		const city = String(item.city ?? "").trim();
		if (city) cityCount[city] = (cityCount[city] ?? 0) + 1;

		const venue = String(item.venue_name ?? item.venue ?? "").trim();
		if (venue) venueCount[venue] = (venueCount[venue] ?? 0) + 1;

		const tId = String(item.tournament_id ?? "").trim();
		const tName = String(item.tournament_name ?? item.tournament ?? "").trim();
		if (tId) {
			const entry = tournamentMap[tId] ?? { id: tId, name: tName || tId, count: 0 };
			entry.count += 1;
			if (tName) entry.name = tName;
			tournamentMap[tId] = entry;
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

		const price = Number(item.min_ticket_price_eur ?? item.min_price_eur ?? 0);
		const priceEur = price > 1000 ? price / 100 : price;
		if (!Number.isNaN(priceEur) && priceEur > 0) {
			if (priceEur < 100) priceRanges["0-99"] += 1;
			else if (priceEur < 200) priceRanges["100-199"] += 1;
			else if (priceEur < 500) priceRanges["200-499"] += 1;
			else if (priceEur < 1000) priceRanges["500-999"] += 1;
			else priceRanges["1000+"] += 1;
		}
	});

	return {
		sports: sportsCount,
		countries: countryCount,
		cities: cityCount,
		venues: venueCount,
		tournaments: Object.values(tournamentMap),
		statuses: statusCount,
		price_ranges: priceRanges,
	};
}

function facetsCoverTotal(facets: Record<string, any> | null, total: number): boolean {
	if (!facets || !facets.statuses) return false;
	const sum = Object.values(facets.statuses).reduce((acc: number, value) => acc + Number(value ?? 0), 0);
	return sum >= total;
}

async function fetchAllPages(
	baseUrl: string,
	options: FetchOptions = {}
): Promise<FetchAllResult> {
	const all: any[] = [];
	let url: string | null = baseUrl;
	let pageCount = 0;
	const maxPages = 100;
	let collectedFacets: Record<string, any> | null = null;

	const resolveNextUrl = (pagination: any): string | null => {
		const nextPage: string | null = pagination?.next_page ?? null;
		if (!nextPage || typeof nextPage !== "string") {
			return null;
		}

		if (nextPage.startsWith("http")) {
			const nextUrl = new URL(nextPage);
			const nextParams = new URLSearchParams(nextUrl.searchParams);
			nextParams.set("origin", "allevents");
			return `/api/xs2/events?${nextParams.toString()}`;
		}

		try {
			const nextUrl = new URL(nextPage, "https://api.xs2event.com/v1/");
			const nextParams = new URLSearchParams(nextUrl.searchParams);
			nextParams.set("origin", "allevents");
			return `/api/xs2/events?${nextParams.toString()}`;
		} catch {
			if (nextPage.includes("=")) {
				const nextParams = new URLSearchParams(nextPage);
				nextParams.set("origin", "allevents");
				return `/api/xs2/events?${nextParams.toString()}`;
			}
		}

		return null;
	};

	while (url && pageCount < maxPages) {
		// Check cache first
		const cached = getCached(url);
		if (cached) {
			console.log("[useEventsAPI] Using cached data for:", url);
			const cachedItems = Array.isArray(cached) ? cached : (cached.events ?? cached.results ?? cached.items ?? []);
			if (cachedItems.length > 0) {
				all.push(...cachedItems);
			}
			if (!collectedFacets && !Array.isArray(cached) && cached.facets) {
				collectedFacets = cached.facets;
			}
			const nextUrl = resolveNextUrl(Array.isArray(cached) ? null : cached.pagination);
			url = nextUrl;
			pageCount++;
			continue;
		}

		try {
			const res = await fetch(url, { signal: options.signal });
			
			if (options.signal?.aborted) {
				throw new Error("Request aborted");
			}

			if (!res.ok) {
				console.warn("[useEventsAPI] Non-OK response", res.status, res.statusText);
				break;
			}

			const data: any = await res.json();
			const items = Array.isArray(data) ? data : (data.events ?? data.results ?? data.items ?? []);

			if (items.length === 0) {
				console.log("[useEventsAPI] No more items on page", pageCount + 1);
				break;
			}

			all.push(...items);
			console.log("[useEventsAPI] Page", pageCount + 1, "- received", items.length, "events (total:", all.length, ")");

			// Cache this page
			setCached(url, data);

			if (!collectedFacets && data.facets) {
				collectedFacets = data.facets;
			}

			// Check for next page
			url = resolveNextUrl(data.pagination);

			pageCount++;
		} catch (error: any) {
			if (error.name === "AbortError" || options.signal?.aborted) {
				console.log("[useEventsAPI] Request aborted");
				throw error;
			}
			console.error("[useEventsAPI] Pagination error:", error);
			break;
		}
	}

	console.log("[useEventsAPI] Fetched", pageCount, "pages,", all.length, "total events");
	return { events: all, facets: collectedFacets };
}

// Build request URL from filters
type RequestUrlOptions = {
	includePastEvents?: boolean;
};

function buildRequestUrl(
	filters: FilterState,
	teamId: string,
	options: RequestUrlOptions = {}
): string {
	const qs = new URLSearchParams();

	const normalizedSports = filters.sportType;

	normalizedSports.forEach((sport) => {
		if (sport) {
			qs.append("sport_type", sport.toLowerCase());
		}
	});

	filters.tournamentId.forEach((id) => {
		if (id) {
			qs.append("tournament_id", id);
		}
	});

	filters.countryCode.forEach((code) => {
		const iso3Code = normalizeToIso3(code);
		if (iso3Code) {
			qs.append("country", iso3Code);
		}
	});

	filters.city.forEach((city) => {
		if (city) {
			qs.append("city", city);
		}
	});

	filters.venue.forEach((venue) => {
		if (venue) {
			qs.append("venue", venue);
		}
	});

	if (teamId && teamId.trim()) {
		qs.set("team_id", teamId.trim());
	}

	const trimmedQuery = filters.query?.trim();
	if (trimmedQuery) {
		qs.set("query", trimmedQuery);
		qs.set("event_name", trimmedQuery); // backwards compatibility
	}

	if (filters.dateFrom && filters.dateFrom.trim()) {
		qs.set("date_start", `ge:${filters.dateFrom.trim()}`);
	}
	if (filters.dateTo && filters.dateTo.trim()) {
		qs.set("date_stop", `le:${filters.dateTo.trim()}`);
	}

	if (filters.popularEvents) {
		qs.set("is_popular", "true");
	}

	if (filters.priceMin > 0) {
		qs.set("price_min", String(filters.priceMin));
	}
	if (filters.priceMax < 10000) {
		qs.set("price_max", String(filters.priceMax));
	}

	filters.eventStatus.forEach((status) => {
		if (status) {
			qs.append("stock_status", status.toLowerCase());
		}
	});

	if (!options.includePastEvents && !qs.has("date_stop") && normalizedSports.length > 0) {
		const today = new Date().toISOString().split("T")[0];
		qs.set("date_stop", `ge:${today}`);
	}

	qs.set("include_past", options.includePastEvents ? "true" : "false");
	qs.set("include_facets", "true");
	qs.set("page_size", "200");
	qs.set("page", "1");
	qs.set("origin", "allevents");

	return `/api/xs2/events?${qs.toString()}`;
}

export function useEventsAPI() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const [facets, setFacets] = useState<Record<string, any>>({});

	const fetchEvents = useCallback(
		async (
			filters: FilterState,
			teamId: string,
			showAllEvents: boolean
		): Promise<any[]> => {
			// Cancel previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller
			const abortController = new AbortController();
			abortControllerRef.current = abortController;

			setLoading(true);
			setError(null);

			try {
				const hasFilters =
					filters.sportType.length > 0 ||
					filters.tournamentId.length > 0 ||
					filters.countryCode.length > 0 ||
					filters.city.length > 0 ||
					filters.venue.length > 0 ||
					filters.eventStatus.length > 0 ||
					filters.priceMin > 0 ||
					filters.priceMax < 10000 ||
					!!teamId ||
					!!filters.query ||
					!!filters.dateFrom ||
					!!filters.dateTo;

				const url = buildRequestUrl(filters, teamId, {
					includePastEvents: false,
				});

				console.log("[useEventsAPI] Fetching events with URL:", url);

				const { events: allItems, facets: serverFacets } = await fetchAllPages(url, {
					signal: abortController.signal,
				});

				console.log("[useEventsAPI] Total received", allItems.length, "events (after pagination)");

				const aggregatedFacets = aggregateFacetsFromEvents(allItems);
				if (facetsCoverTotal(serverFacets, allItems.length)) {
					setFacets(serverFacets as Record<string, any>);
				} else {
					setFacets(aggregatedFacets);
				}

				if (abortController.signal.aborted) {
					throw new Error("Request aborted");
				}

				setLoading(false);
				return allItems;
			} catch (err: any) {
				if (err.name === "AbortError" || abortController.signal.aborted) {
					console.log("[useEventsAPI] Request aborted");
					return [];
				}
				console.error("[useEventsAPI] Fetch error:", err);
				setError(err);
				setLoading(false);
				throw err;
			}
		},
		[]
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	return {
		fetchEvents,
		loading,
		error,
		facets,
	};
}

