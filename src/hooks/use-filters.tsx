"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

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

function serializeFilters(filters: FilterState, base: FilterState): string {
	const params = new URLSearchParams();

	if (!arraysEqual(filters.sportType, base.sportType) && filters.sportType.length > 0) {
		params.set("sport_type", filters.sportType.join(","));
	}
	if (!arraysEqual(filters.tournamentId, base.tournamentId) && filters.tournamentId.length > 0) {
		params.set("tournament_id", filters.tournamentId.join(","));
	}
	if (!arraysEqual(filters.countryCode, base.countryCode) && filters.countryCode.length > 0) {
		params.set("country", filters.countryCode.join(","));
	}
	if (!arraysEqual(filters.city, base.city) && filters.city.length > 0) {
		params.set("city", filters.city.join(","));
	}
	if (!arraysEqual(filters.venue, base.venue) && filters.venue.length > 0) {
		params.set("venue", filters.venue.join(","));
	}
	if (filters.dateFrom && filters.dateFrom !== base.dateFrom) {
		params.set("date_from", filters.dateFrom);
	}
	if (filters.dateTo && filters.dateTo !== base.dateTo) {
		params.set("date_to", filters.dateTo);
	}
	if (filters.priceMin !== base.priceMin) {
		params.set("price_min", String(filters.priceMin));
	}
	if (filters.priceMax !== base.priceMax) {
		params.set("price_max", String(filters.priceMax));
	}
	if ((filters.query || "") !== (base.query || "")) {
		params.set("query", filters.query);
	}
	if (filters.popularEvents !== base.popularEvents) {
		params.set("popular_events", String(filters.popularEvents));
	}
	if (!arraysEqual(filters.eventStatus, base.eventStatus) && filters.eventStatus.length > 0) {
		params.set("event_status", filters.eventStatus.join(","));
	}

	return params.toString();
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
	const router = useRouter();

	const searchParamsKey = useMemo(() => searchParams.toString(), [searchParams]);
	const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParamsKey), [searchParamsKey]);

	const baseFilters = useMemo(() => buildBaseFilters(pathname), [pathname]);
	const initialFilters = useMemo(() => buildFiltersFromSearch(pathname, searchParamsSnapshot), [pathname, searchParamsSnapshot]);

	const [filters, setFilters] = useState<FilterState>(initialFilters);
	const baseFiltersRef = useRef(baseFilters);
	const lastSyncedSearchRef = useRef<string>(searchParamsKey);
	const isNavigatingRef = useRef(false);

	useEffect(() => {
		baseFiltersRef.current = baseFilters;
	}, [baseFilters]);

	useEffect(() => {
		setFilters(cloneFilters(initialFilters));
		lastSyncedSearchRef.current = searchParamsKey;
		isNavigatingRef.current = false;
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

	useEffect(() => {
		if (!router || !pathname) return;

		// Prevent feedback loop when updates originate from router changes
		if (isNavigatingRef.current) {
			isNavigatingRef.current = false;
			return;
		}

		const serialized = serializeFilters(filters, baseFiltersRef.current);

		// Skip if nothing changed
		if (serialized === lastSyncedSearchRef.current) {
			return;
		}

		lastSyncedSearchRef.current = serialized;
		const target = serialized ? `${pathname}?${serialized}` : pathname;
		isNavigatingRef.current = true;
		router.replace(target, { scroll: false });
	}, [filters, pathname, router]);

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

