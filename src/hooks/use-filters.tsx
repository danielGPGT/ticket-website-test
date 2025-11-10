"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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

type FiltersContextValue = {
	filters: FilterState;
	teamId: string;
	showAllEvents: boolean;
	updateFilters: (partial: Partial<FilterState> | FilterState) => void;
	clearFilters: () => void;
	activeFilterCount: number;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

// Map pathname to sport type
const PATHNAME_TO_SPORT: Record<string, string> = {
	"/formula-1": "formula1",
	"/football": "football",
	"/motogp": "motogp",
	"/tennis": "tennis",
};

const DEFAULT_PRICE_RANGE: [number, number] = [0, 10000];

function cloneFilters(filters: FilterState): FilterState {
	return {
		sportType: [...filters.sportType],
		tournamentId: [...filters.tournamentId],
		countryCode: [...filters.countryCode],
		city: [...filters.city],
		venue: [...filters.venue],
		dateFrom: filters.dateFrom,
		dateTo: filters.dateTo,
		priceMin: filters.priceMin,
		priceMax: filters.priceMax,
		query: filters.query,
		popularEvents: filters.popularEvents,
		eventStatus: [...filters.eventStatus],
	};
}

function buildBaseFilters(pathname: string): FilterState {
	const sportFromPathname = PATHNAME_TO_SPORT[pathname] || null;
	return {
		sportType: sportFromPathname ? [sportFromPathname] : [],
		tournamentId: [],
		countryCode: [],
		city: [],
		venue: [],
		dateFrom: "",
		dateTo: "",
		priceMin: DEFAULT_PRICE_RANGE[0],
		priceMax: DEFAULT_PRICE_RANGE[1],
		query: "",
		popularEvents: false,
		eventStatus: ["on_sale"],
	};
}

function parseArrayParam(params: URLSearchParams, key: string): string[] {
	const value = params.get(key);
	if (!value) return [];
	return value.includes(",") ? value.split(",").filter(Boolean) : [value];
}

function buildFiltersFromSearch(pathname: string, params: URLSearchParams): FilterState {
	const base = buildBaseFilters(pathname);
	const filters = cloneFilters(base);

	const urlSportTypes = parseArrayParam(params, "sport_type");
	if (urlSportTypes.length > 0) {
		filters.sportType = urlSportTypes;
	}

	filters.tournamentId = parseArrayParam(params, "tournament_id");
	filters.countryCode = parseArrayParam(params, "country");
	filters.city = parseArrayParam(params, "city");
	filters.venue = parseArrayParam(params, "venue");

	const dateFrom = params.get("date_from");
	const dateTo = params.get("date_to");
	filters.dateFrom = dateFrom ?? "";
	filters.dateTo = dateTo ?? "";

	const priceMin = params.get("price_min");
	const priceMax = params.get("price_max");
	filters.priceMin = priceMin ? Number(priceMin) || base.priceMin : base.priceMin;
	filters.priceMax = priceMax ? Number(priceMax) || base.priceMax : base.priceMax;

	const query = params.get("query");
	filters.query = query ?? "";

	const popularEvents = params.get("popular_events");
	filters.popularEvents = popularEvents === "true";

	const eventStatus = parseArrayParam(params, "event_status");
	if (eventStatus.length > 0) {
		filters.eventStatus = eventStatus;
	}

	return filters;
}

function arraysEqual(a: string[], b: string[]) {
	if (a.length !== b.length) return false;
	return a.every((value, index) => value === b[index]);
}

function countArrayDifference(current: string[], base: string[]) {
	if (arraysEqual(current, base)) {
		return 0;
	}
	return Math.max(current.length, base.length, 1);
}

function countActiveFilters(current: FilterState, base: FilterState) {
	let count = 0;

	count += countArrayDifference(current.sportType, base.sportType);
	count += countArrayDifference(current.tournamentId, base.tournamentId);
	count += countArrayDifference(current.countryCode, base.countryCode);
	count += countArrayDifference(current.city, base.city);
	count += countArrayDifference(current.venue, base.venue);
	count += countArrayDifference(current.eventStatus, base.eventStatus);

	if (current.dateFrom !== base.dateFrom && (current.dateFrom || base.dateFrom)) {
		count += 1;
	}
	if (current.dateTo !== base.dateTo && (current.dateTo || base.dateTo)) {
		count += 1;
	}
	if (current.priceMin !== base.priceMin || current.priceMax !== base.priceMax) {
		count += 1;
	}
	if ((current.query || "") !== (base.query || "")) {
		count += 1;
	}
	if (current.popularEvents !== base.popularEvents) {
		count += 1;
	}

	return count;
}

export function FiltersProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const searchParamsKey = useMemo(() => searchParams.toString(), [searchParams]);
	const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParamsKey), [searchParamsKey]);

	const baseFilters = useMemo(() => buildBaseFilters(pathname), [pathname]);
	const initialFilters = useMemo(() => buildFiltersFromSearch(pathname, searchParamsSnapshot), [pathname, searchParamsSnapshot]);

	const [filters, setFilters] = useState<FilterState>(initialFilters);
	const baseFiltersRef = useRef(baseFilters);

	useEffect(() => {
		baseFiltersRef.current = baseFilters;
	}, [baseFilters]);

	useEffect(() => {
		setFilters(cloneFilters(initialFilters));
	}, [initialFilters]);

	const updateFilters = useCallback((partial: Partial<FilterState> | FilterState) => {
		if (!partial || Object.keys(partial).length === 0) {
			setFilters(cloneFilters(baseFiltersRef.current));
			return;
		}

		setFilters((prev) => {
			const merged = { ...prev, ...partial } as FilterState;
			return cloneFilters(merged);
		});
	}, []);

	const clearFilters = useCallback(() => {
		setFilters(cloneFilters(baseFiltersRef.current));
	}, []);

	const teamId = useMemo(
		() => searchParamsSnapshot.get("team") || searchParamsSnapshot.get("team_id") || "",
		[searchParamsSnapshot],
	);

const showAllEvents = useMemo(() => {
	return baseFiltersRef.current.sportType.length > 0;
}, [pathname]);

	const activeFilterCount = useMemo(
		() => countActiveFilters(filters, baseFiltersRef.current),
		[filters],
	);

	const contextValue = useMemo<FiltersContextValue>(() => ({
		filters,
		teamId,
		showAllEvents,
		updateFilters,
		clearFilters,
		activeFilterCount,
	}), [filters, teamId, showAllEvents, updateFilters, clearFilters, activeFilterCount]);

	return (
		<FiltersContext.Provider value={contextValue}>
			{children}
		</FiltersContext.Provider>
	);
}

export function useFilters() {
	const context = useContext(FiltersContext);
	if (!context) {
		throw new Error("useFilters must be used within a FiltersProvider");
	}
	return context;
}

