import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

export function useFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Parse filters from URL - support both single and array values
	const filters: FilterState = useMemo(() => {
		const getArrayParam = (key: string): string[] => {
			const param = searchParams.get(key);
			if (!param) return [];
			return param.includes(",") ? param.split(",").filter(Boolean) : [param];
		};

		return {
			sportType: getArrayParam("sport_type"),
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
	}, [searchParams]);

	// Get additional URL parameters
	const teamId = searchParams.get("team") || searchParams.get("team_id") || "";
	const origin = searchParams.get("origin") || "";
	const showAllEvents = origin === "allevents";

	const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
		const params = new URLSearchParams();
		params.set("origin", "allevents");

		// Merge with existing filters
		const mergedFilters = { ...filters, ...newFilters };

		// Add filters to URL
		if (mergedFilters.sportType.length > 0) {
			params.set("sport_type", mergedFilters.sportType.join(","));
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

		router.push(`/events?${params.toString()}`);
	}, [filters, router]);

	const clearFilters = useCallback(() => {
		router.push("/events");
	}, [router]);

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

