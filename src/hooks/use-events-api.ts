import { useState, useCallback, useRef, useEffect } from "react";
import { normalizeToIso3 } from "@/lib/country-flags";
import type { FilterState } from "./use-filters";

type FetchOptions = {
	signal?: AbortSignal;
};

type FetchResult = {
	events: any[];
	error?: Error;
};

// Cache for API responses
const cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(url: string): string {
	return url;
}

function getCached(url: string): any[] | null {
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

function setCached(url: string, data: any[]): void {
	const key = getCacheKey(url);
	cache.set(key, { data, timestamp: Date.now() });
}

// Helper function to fetch all pages for a single request
async function fetchAllPages(
	baseUrl: string,
	options: FetchOptions = {}
): Promise<any[]> {
	const all: any[] = [];
	let url: string | null = baseUrl;
	let pageCount = 0;
	const maxPages = 100;

	while (url && pageCount < maxPages) {
		// Check cache first
		const cached = getCached(url);
		if (cached) {
			console.log("[useEventsAPI] Using cached data for:", url);
			all.push(...cached);
			// Still need to check for next page
			url = null; // Simplified for cached data
			break;
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
			setCached(url, items);

			// Check for next page
			const pagination: any = data.pagination;
			const nextPage: string | null = pagination?.next_page;

			if (!nextPage || nextPage === "string" || nextPage === url) {
				url = null;
			} else if (nextPage.startsWith("http")) {
				const nextUrl = new URL(nextPage);
				const nextParams = new URLSearchParams(nextUrl.searchParams);
				nextParams.set("origin", "allevents");
				url = `/api/xs2/events?${nextParams.toString()}`;
			} else {
				try {
					const nextUrl = new URL(nextPage, "https://api.xs2event.com/v1/");
					const nextParams = new URLSearchParams(nextUrl.searchParams);
					nextParams.set("origin", "allevents");
					url = `/api/xs2/events?${nextParams.toString()}`;
				} catch {
					if (nextPage.includes("=")) {
						const nextParams = new URLSearchParams(nextPage);
						nextParams.set("origin", "allevents");
						url = `/api/xs2/events?${nextParams.toString()}`;
					} else {
						url = null;
					}
				}
			}

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
	return all;
}

// Build request URL from filters
function buildRequestUrl(
	filters: FilterState,
	teamId: string,
	sportType?: string,
	tournamentId?: string,
	countryCode?: string
): string {
	const qs = new URLSearchParams();

	if (sportType) {
		qs.set("sport_type", sportType);
	}
	if (tournamentId) {
		qs.set("tournament_id", tournamentId);
	}
	if (countryCode) {
		const iso3Code = normalizeToIso3(countryCode);
		if (iso3Code) {
			qs.set("country", iso3Code);
		}
	}
	if (teamId && teamId.trim()) {
		qs.set("team_id", teamId.trim());
	}
	if (filters.query && filters.query.trim()) {
		qs.set("event_name", filters.query.trim());
	}

	if (filters.dateFrom && filters.dateFrom.trim()) {
		qs.set("date_start", `ge:${filters.dateFrom.trim()}`);
	}
	if (filters.dateTo && filters.dateTo.trim()) {
		qs.set("date_stop", `le:${filters.dateTo.trim()}`);
	}

	const today = new Date().toISOString().split("T")[0];
	const showAllEvents = false; // Can be passed as parameter if needed
	if (!showAllEvents && !filters.dateFrom && !filters.dateTo) {
		const hasOtherFilters = sportType || tournamentId || countryCode || teamId || filters.query;
		if (hasOtherFilters && sportType) {
			qs.set("date_stop", `ge:${today}`);
		}
	}

	if (filters.popularEvents) {
		qs.set("popular_events", "true");
	}

	qs.set("page_size", "100");
	qs.set("page", "1");
	qs.set("origin", "allevents");

	return `/api/xs2/events?${qs.toString()}`;
}

export function useEventsAPI() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

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
				const today = new Date().toISOString().split("T")[0];
				const hasFilters =
					filters.sportType.length > 0 ||
					filters.tournamentId.length > 0 ||
					filters.countryCode.length > 0 ||
					teamId ||
					filters.query ||
					filters.dateFrom ||
					filters.dateTo;

				const requests: Promise<any[]>[] = [];

				// If no filters, show popular sports by default
				if (!hasFilters) {
					console.log("[useEventsAPI] No filters - fetching popular sports");
					const popularSports = ["formula1", "football", "tennis", "motogp"];
					for (const sport of popularSports) {
						const url = buildRequestUrl(filters, teamId, sport);
						requests.push(fetchAllPages(url, { signal: abortController.signal }));
					}
				} else {
					// Build requests based on filters
					if (filters.sportType.length > 0) {
						if (filters.countryCode.length > 0) {
							for (const sport of filters.sportType) {
								for (const country of filters.countryCode) {
									const url = buildRequestUrl(filters, teamId, sport, undefined, country);
									requests.push(fetchAllPages(url, { signal: abortController.signal }));
								}
							}
						} else {
							for (const sport of filters.sportType) {
								const url = buildRequestUrl(filters, teamId, sport);
								requests.push(fetchAllPages(url, { signal: abortController.signal }));
							}
						}
					} else if (filters.tournamentId.length > 0) {
						for (const tournament of filters.tournamentId) {
							const url = buildRequestUrl(
								filters,
								teamId,
								undefined,
								tournament,
								filters.countryCode[0]
							);
							requests.push(fetchAllPages(url, { signal: abortController.signal }));
						}
					} else if (filters.countryCode.length > 0) {
						for (const country of filters.countryCode) {
							const url = buildRequestUrl(filters, teamId, undefined, undefined, country);
							requests.push(fetchAllPages(url, { signal: abortController.signal }));
						}
					} else if (teamId || filters.query || filters.dateFrom || filters.dateTo) {
						const url = buildRequestUrl(filters, teamId);
						requests.push(fetchAllPages(url, { signal: abortController.signal }));
					}
				}

				if (requests.length === 0) {
					setLoading(false);
					return [];
				}

				console.log("[useEventsAPI] Making", requests.length, "API request(s)");

				// Fetch all requests in parallel
				const resultsArrays = await Promise.all(requests);

				// Combine and deduplicate
				const allItems: any[] = [];
				const seenIds = new Set<string>();

				resultsArrays.flat().forEach((item: any) => {
					const id = String(item.id ?? item.event_id ?? "").trim();
					if (!id || seenIds.has(id)) return;
					seenIds.add(id);
					allItems.push(item);
				});

				console.log("[useEventsAPI] Total received", allItems.length, "events (after deduplication)");

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
	};
}

