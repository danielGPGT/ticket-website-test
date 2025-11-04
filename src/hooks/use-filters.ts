import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type FilterState = {
	sportType: string[];
	tournamentId: string[];
	countryCode: string[];
	city: string[];
	venue: string[];
	dateFrom: string;
	dateTo: string;
	priceMin: number;
	priceMax: number;
	query: string;
	popularEvents: boolean;
	eventStatus: string[];
};

// Map pathname to sport type
const PATHNAME_TO_SPORT: Record<string, string> = {
	"/formula-1": "formula1",
	"/football": "football",
	"/motogp": "motogp",
	"/tennis": "tennis",
};

export function useFilters() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Detect sport from pathname
	const sportFromPathname = useMemo(() => {
		return PATHNAME_TO_SPORT[pathname] || null;
	}, [pathname]);

	// Parse filters from URL - support both single and array values
	// If on a sport page and no sport_type in URL, infer from pathname
	const filters: FilterState = useMemo(() => {
		const getArrayParam = (key: string): string[] => {
			const param = searchParams.get(key);
			if (!param) return [];
			return param.includes(",") ? param.split(",").filter(Boolean) : [param];
		};

		const urlSportType = getArrayParam("sport_type");
		// If on sport page and no sport_type in URL, use pathname sport
		const sportType = urlSportType.length > 0 
			? urlSportType 
			: sportFromPathname 
				? [sportFromPathname] 
				: [];

		return {
			sportType,
			tournamentId: getArrayParam("tournament_id"),
			countryCode: getArrayParam("country"),
			city: getArrayParam("city"),
			venue: getArrayParam("venue"),
			dateFrom: searchParams.get("date_from") || "",
			dateTo: searchParams.get("date_to") || "",
			priceMin: parseInt(searchParams.get("price_min") || "0") || 0,
			priceMax: parseInt(searchParams.get("price_max") || "10000") || 10000,
			query: searchParams.get("query") || "",
			popularEvents: searchParams.get("popular_events") === "true",
			eventStatus: getArrayParam("event_status"),
		};
	}, [searchParams, sportFromPathname]);

	// Get additional URL parameters
	const teamId = searchParams.get("team") || searchParams.get("team_id") || "";
	const origin = searchParams.get("origin") || "";
	// Show all events if origin=allevents OR if on a sport page (sport pages show all events for that sport)
	const showAllEvents = origin === "allevents" || sportFromPathname !== null;

	const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
		const params = new URLSearchParams();
		
		// Determine if we're on a sport page
		const isSportPage = sportFromPathname !== null;
		
		// Only add origin=allevents if NOT on a sport page (sport pages don't need it)
		if (!isSportPage) {
			params.set("origin", "allevents");
		}

		// Merge with existing filters
		const mergedFilters = { ...filters, ...newFilters };

		// Get base path (sport page path or /events)
		const getBasePath = isSportPage ? pathname : "/events";

		// Add sport filter only if it's different from the page's default sport
		// On sport pages, don't add sport_type to URL if it matches the page
		if (mergedFilters.sportType.length > 0) {
			const sportMatchesPage = isSportPage && mergedFilters.sportType.length === 1 && mergedFilters.sportType[0] === sportFromPathname;
			if (!sportMatchesPage) {
				params.set("sport_type", mergedFilters.sportType.join(","));
			}
		}
		if (mergedFilters.tournamentId.length > 0) {
			params.set("tournament_id", mergedFilters.tournamentId.join(","));
		}
		if (mergedFilters.countryCode.length > 0) {
			params.set("country", mergedFilters.countryCode.join(","));
		}
		if (mergedFilters.city.length > 0) {
			params.set("city", mergedFilters.city.join(","));
		}
		if (mergedFilters.venue.length > 0) {
			params.set("venue", mergedFilters.venue.join(","));
		}
		if (mergedFilters.dateFrom) {
			params.set("date_from", mergedFilters.dateFrom);
		}
		if (mergedFilters.dateTo) {
			params.set("date_to", mergedFilters.dateTo);
		}
		if (mergedFilters.priceMin > 0) {
			params.set("price_min", String(mergedFilters.priceMin));
		}
		if (mergedFilters.priceMax < 10000) {
			params.set("price_max", String(mergedFilters.priceMax));
		}
		if (mergedFilters.query) {
			params.set("query", mergedFilters.query);
		}
		if (mergedFilters.popularEvents) {
			params.set("popular_events", "true");
		}
		if (mergedFilters.eventStatus.length > 0) {
			params.set("event_status", mergedFilters.eventStatus.join(","));
		}

		// Only add query params if there are any, otherwise just use the base path
		const hasParams = params.toString().length > 0;
		const newUrl = hasParams ? `${getBasePath}?${params.toString()}` : getBasePath;
		router.push(newUrl);
	}, [filters, router, pathname, sportFromPathname]);

	const clearFilters = useCallback(() => {
		// If on a sport page, clear to the sport page, otherwise to /events
		const targetPath = sportFromPathname ? pathname : "/events";
		router.push(targetPath);
	}, [router, pathname, sportFromPathname]);

	const activeFilterCount = useMemo(() => {
		return (
			filters.sportType.length +
			filters.tournamentId.length +
			filters.countryCode.length +
			filters.city.length +
			filters.venue.length +
			(filters.dateFrom ? 1 : 0) +
			(filters.dateTo ? 1 : 0) +
			(filters.priceMin > 0 || filters.priceMax < 10000 ? 1 : 0) +
			(filters.query ? 1 : 0) +
			(filters.popularEvents ? 1 : 0) +
			filters.eventStatus.length
		);
	}, [filters]);

	return {
		filters,
		teamId,
		showAllEvents,
		updateFilters,
		clearFilters,
		activeFilterCount,
	};
}

