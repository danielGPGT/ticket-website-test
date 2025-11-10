"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
	Search, X, Calendar, MapPin, DollarSign, Filter, 
	Globe, Building2, Trophy, Landmark, ChevronDown, ChevronUp, Activity, Star, Flame, CircleDot
} from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { getCountryName } from "@/lib/country-flags";
import type { FilterState } from "@/hooks/use-filters";

type FilterOption = {
	value: string;
	label: string;
	count?: number;
};

type FacetData = {
	sports?: Record<string, number>;
	tournaments?: Array<{ id: string; name: string; season?: string; count: number }>;
	countries?: Record<string, number>;
	cities?: Record<string, number>;
	venues?: Record<string, number>;
	statuses?: Record<string, number>;
	price_ranges?: Record<string, number>;
};

type EventsFiltersProps = {
	onFilterChange: (filters: FilterState) => void;
	initialFilters?: Partial<FilterState>;
	facets?: FacetData | null;
	events?: any[];
	isMobile?: boolean; // If true, remove border and shadow for mobile drawer
	hiddenFilters?: string[]; // Array of filter IDs to hide (e.g., ["sport"])
};

// Re-export FilterState type for backward compatibility
export type { FilterState };

// Format sport type for display
function formatSportType(sportType: string): string {
	const formatted: Record<string, string> = {
		formula1: "Formula 1",
		motogp: "MotoGP",
		soccer: "Football",
		football: "Football",
		tennis: "Tennis",
		basketball: "Basketball",
		icehockey: "Ice Hockey",
		rugby: "Rugby",
		baseball: "Baseball",
		americanfootball: "American Football",
	};
	
	if (formatted[sportType.toLowerCase()]) {
		return formatted[sportType.toLowerCase()];
	}
	
	return sportType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatusLabel(status: string): string {
	const map: Record<string, string> = {
		on_sale: "On Sale",
		coming_soon: "Coming Soon",
		sales_closed: "Sales Closed",
		not_confirmed: "Not Confirmed",
	};

	const key = status.toLowerCase();
	if (map[key]) {
		return map[key];
	}

	return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function EventsFilters({ onFilterChange, initialFilters = {}, facets, events = [], isMobile = false, hiddenFilters = [] }: EventsFiltersProps) {
	// Expandable sections state - expand key sections by default
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		popularEvents: false,
		eventStatus: false,
		sport: true, // Expanded by default
		country: false,
		city: false,
		competition: true, // Expanded by default
		venue: false,
		price: false,
	});
	
	// Show all state for long lists
	const [showAll, setShowAll] = useState<Record<string, boolean>>({
		venue: false,
		city: false,
	});
	
	const [filters, setFilters] = useState<FilterState>({
		sportType: Array.isArray(initialFilters.sportType) ? initialFilters.sportType : (initialFilters.sportType ? [initialFilters.sportType] : []),
		tournamentId: Array.isArray(initialFilters.tournamentId) ? initialFilters.tournamentId : (initialFilters.tournamentId ? [initialFilters.tournamentId] : []),
		countryCode: Array.isArray(initialFilters.countryCode) ? initialFilters.countryCode : (initialFilters.countryCode ? [initialFilters.countryCode] : []),
		city: Array.isArray(initialFilters.city) ? initialFilters.city : (initialFilters.city ? [initialFilters.city] : []),
		venue: Array.isArray(initialFilters.venue) ? initialFilters.venue : (initialFilters.venue ? [initialFilters.venue] : []),
		dateFrom: initialFilters.dateFrom || "",
		dateTo: initialFilters.dateTo || "",
		priceMin: initialFilters.priceMin ?? 0,
		priceMax: initialFilters.priceMax ?? 10000,
		query: initialFilters.query || "",
		popularEvents: initialFilters.popularEvents ?? false,
		eventStatus: Array.isArray(initialFilters.eventStatus) ? initialFilters.eventStatus : (initialFilters.eventStatus ? [initialFilters.eventStatus] : []),
	});

	// Filter options with counts
	const [sports, setSports] = useState<FilterOption[]>([]);
	const [tournaments, setTournaments] = useState<FilterOption[]>([]);
	const [countries, setCountries] = useState<FilterOption[]>([]);
	const [cities, setCities] = useState<FilterOption[]>([]);
	const [venues, setVenues] = useState<FilterOption[]>([]);
	const [eventStatuses, setEventStatuses] = useState<FilterOption[]>([]);
	
	const [loading, setLoading] = useState({
		sports: true,
		tournaments: false,
		countries: false,
		cities: false,
		venues: false,
	});

	// Local search query state (for debouncing)
	const [searchQuery, setSearchQuery] = useState(filters.query || "");
	const externalQuery = typeof initialFilters.query === "string" ? initialFilters.query : "";
	const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Keep local query state in sync with external filter changes (e.g. mobile search bar)
	useEffect(() => {
		if (searchDebounceRef.current) {
			clearTimeout(searchDebounceRef.current);
			searchDebounceRef.current = null;
		}

		setFilters((prev) => {
			if (prev.query === externalQuery) {
				return prev;
			}
			return { ...prev, query: externalQuery };
		});

		setSearchQuery((prev) => (prev === externalQuery ? prev : externalQuery));
		// externalQuery changes when URL/search params change
	}, [externalQuery]);

	// Cleanup pending search updates on unmount
	useEffect(() => {
		return () => {
			if (searchDebounceRef.current) {
				clearTimeout(searchDebounceRef.current);
			}
		};
	}, []);

	// Price range state
	const [priceRange, setPriceRange] = useState<[number, number]>([
		filters.priceMin || 0,
		filters.priceMax || 10000,
	]);

	const priceRangeFromFacets = useMemo(() => {
		const buckets = facets?.price_ranges;
		const orderedBuckets = [
			{ key: "0-99", min: 0, max: 99 },
			{ key: "100-199", min: 100, max: 199 },
			{ key: "200-499", min: 200, max: 499 },
			{ key: "500-999", min: 500, max: 999 },
			{ key: "1000+", min: 1000, max: 10000 },
		];

		if (!buckets) {
			return [0, 10000] as [number, number];
		}

		const active = orderedBuckets.filter((bucket) => (buckets[bucket.key] ?? 0) > 0);
		if (active.length === 0) {
			return [0, 10000] as [number, number];
		}

		const min = active[0].min;
		const max = active[active.length - 1].max;
		return [min, max] as [number, number];
	}, [facets]);

	useEffect(() => {
		const { sports: facetSports, tournaments: facetTournaments, countries: facetCountries, cities: facetCities, venues: facetVenues, statuses: facetStatuses, price_ranges: facetPriceRanges } = facets ?? {};

		const fallbackEvents = (!facets || events.length > 0) ? events : [];

		const buildSports = () => {
			if (facetSports && Object.keys(facetSports).length > 0) {
				return Object.entries(facetSports)
					.map(([key, count]) => ({ value: key, label: formatSportType(key), count }))
					.sort((a, b) => a.label.localeCompare(b.label));
			}

			const map = new Map<string, number>();
			fallbackEvents.forEach((e: any) => {
				const sportType = String(e.sport_type ?? "").trim().toLowerCase();
				if (!sportType) return;
				map.set(sportType, (map.get(sportType) ?? 0) + 1);
			});
			return Array.from(map.entries())
				.map(([sportType, count]) => ({ value: sportType, label: formatSportType(sportType), count }))
				.sort((a, b) => a.label.localeCompare(b.label));
		};

		const buildTournaments = () => {
			if (facetTournaments && facetTournaments.length > 0) {
				return facetTournaments
					.map((t) => ({ value: t.id, label: t.season ? `${t.name} (${t.season})` : t.name, count: t.count }))
					.sort((a, b) => a.label.localeCompare(b.label));
			}

			const map = new Map<string, { name: string; season?: string; count: number }>();
			fallbackEvents.forEach((e: any) => {
				const tournamentId = String(e.tournament_id ?? "").trim();
				if (!tournamentId) return;
				const tournamentName = String(e.tournament_name ?? e.tournament ?? "").trim();
				let season = e.season ? String(e.season) : "";
				if (!season && e.date_start) {
					const date = new Date(e.date_start);
					if (!Number.isNaN(date.getTime())) {
						season = String(date.getFullYear());
					}
				}
				const entry = map.get(tournamentId) ?? { name: tournamentName || tournamentId, season, count: 0 };
				entry.count += 1;
				if (tournamentName) entry.name = tournamentName;
				if (season && !entry.season) entry.season = season;
				map.set(tournamentId, entry);
			});
			return Array.from(map.entries())
				.map(([id, data]) => ({ value: id, label: data.season ? `${data.name} (${data.season})` : data.name, count: data.count }))
				.sort((a, b) => a.label.localeCompare(b.label));
		};

		const buildCountries = () => {
			if (facetCountries && Object.keys(facetCountries).length > 0) {
				return Object.entries(facetCountries)
					.map(([code, count]) => ({ value: code, label: getCountryName(code) || code, count }))
					.sort((a, b) => b.count! - a.count!);
			}

			const map = new Map<string, number>();
			fallbackEvents.forEach((e: any) => {
				const code = String(e.iso_country ?? e.country ?? "").trim().toUpperCase();
				if (!code) return;
				map.set(code, (map.get(code) ?? 0) + 1);
			});
			return Array.from(map.entries())
				.map(([code, count]) => ({ value: code, label: getCountryName(code) || code, count }))
				.sort((a, b) => b.count! - a.count!);
		};

		const buildCities = () => {
			if (facetCities && Object.keys(facetCities).length > 0) {
				return Object.entries(facetCities)
					.map(([city, count]) => ({ value: city, label: city, count }))
					.sort((a, b) => b.count! - a.count!);
			}

			const map = new Map<string, number>();
			fallbackEvents.forEach((e: any) => {
				const city = String(e.city ?? "").trim();
				if (!city) return;
				map.set(city, (map.get(city) ?? 0) + 1);
			});
			return Array.from(map.entries())
				.map(([city, count]) => ({ value: city, label: city, count }))
				.sort((a, b) => b.count! - a.count!);
		};

		const buildVenues = () => {
			if (facetVenues && Object.keys(facetVenues).length > 0) {
				return Object.entries(facetVenues)
					.map(([venue, count]) => ({ value: venue, label: venue, count }))
					.sort((a, b) => b.count! - a.count!);
			}

			const map = new Map<string, number>();
			fallbackEvents.forEach((e: any) => {
				const venue = String(e.venue_name ?? e.venue ?? "").trim();
				if (!venue) return;
				map.set(venue, (map.get(venue) ?? 0) + 1);
			});
			return Array.from(map.entries())
				.map(([venue, count]) => ({ value: venue, label: venue, count }))
				.sort((a, b) => b.count! - a.count!);
		};

		const buildStatuses = () => {
			if (facetStatuses && Object.keys(facetStatuses).length > 0) {
				return Object.entries(facetStatuses)
					.map(([status, count]) => ({ value: status, label: formatStatusLabel(status), count }))
					.sort((a, b) => b.count! - a.count!);
			}

			const map = new Map<string, number>();
			fallbackEvents.forEach((e: any) => {
				const rawStatus = String(e.event_status ?? "").trim().toLowerCase();
				const numberOfTickets = Number(e.number_of_tickets ?? 0);
				let derivedStatus = "coming_soon";
				if (rawStatus === "soldout" || rawStatus === "closed") {
					derivedStatus = "sales_closed";
				} else if (rawStatus === "cancelled" || rawStatus === "postponed") {
					derivedStatus = "not_confirmed";
				} else if (numberOfTickets > 0) {
					derivedStatus = "on_sale";
				}
				map.set(derivedStatus, (map.get(derivedStatus) ?? 0) + 1);
			});
			return Array.from(map.entries())
				.map(([status, count]) => ({ value: status, label: formatStatusLabel(status), count }))
				.sort((a, b) => b.count! - a.count!);
		};

		setSports(buildSports());
		setTournaments(buildTournaments());
		setCountries(buildCountries());
		setCities(buildCities());
		setVenues(buildVenues());
		setEventStatuses(buildStatuses());

		setLoading((prev) => ({ ...prev, sports: false, tournaments: false, countries: false, cities: false, venues: false }));
	}, [facets, events]);

	// Legacy events-based filter extraction removed

	// Update filters and notify parent
	const updateFilter = useCallback((key: keyof FilterState, value: any) => {
		setFilters((prev) => {
			const newFilters = { ...prev, [key]: value };
			onFilterChange(newFilters);
			return newFilters;
		});
	}, [onFilterChange]);

	const scheduleQueryUpdate = useCallback((value: string) => {
		const normalized = value.trim();
		if (normalized === (filters.query || "")) {
			return;
		}

		if (searchDebounceRef.current) {
			clearTimeout(searchDebounceRef.current);
		}
		searchDebounceRef.current = setTimeout(() => {
			updateFilter("query", normalized);
		}, 500);
	}, [filters.query, updateFilter]);

	const toggleFilterArray = useCallback((key: "sportType" | "tournamentId" | "countryCode" | "city" | "venue" | "eventStatus", value: string) => {
		setFilters((prev) => {
			const current = prev[key] || [];
			const newArray = current.includes(value)
				? current.filter(v => v !== value)
				: [...current, value];
			const newFilters = { ...prev, [key]: newArray };
			
			// Clear dependent filters
			if (key === "sportType") {
				newFilters.tournamentId = [];
			}
			
			onFilterChange(newFilters);
			return newFilters;
		});
	}, [onFilterChange]);

	const clearFilters = () => {
		if (searchDebounceRef.current) {
			clearTimeout(searchDebounceRef.current);
			searchDebounceRef.current = null;
		}

		const [facetMin, facetMax] = priceRangeFromFacets;
		const cleared: FilterState = {
			sportType: [],
			tournamentId: [],
			countryCode: [],
			city: [],
			venue: [],
			dateFrom: "",
			dateTo: "",
			priceMin: 0,
			priceMax: 10000,
			query: "",
			popularEvents: false,
			eventStatus: [],
		};
		setFilters(cleared);
		setSearchQuery("");
		setPriceRange([facetMin, facetMax]);
		onFilterChange(cleared);
	};

	const defaultPriceMin = priceRangeFromFacets[0];
	const defaultPriceMax = priceRangeFromFacets[1];

	const activeFilterCount = 
		filters.sportType.length +
		filters.tournamentId.length +
		filters.countryCode.length +
		filters.city.length +
		filters.venue.length +
		(filters.dateFrom ? 1 : 0) +
		(filters.dateTo ? 1 : 0) +
		(filters.priceMin > defaultPriceMin || filters.priceMax < defaultPriceMax ? 1 : 0) +
		(filters.query ? 1 : 0) +
		(filters.popularEvents ? 1 : 0) +
		filters.eventStatus.length;

	const toggleSection = (section: string) => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	};

	const FilterSection = ({ 
		id, 
		icon: Icon, 
		title, 
		children, 
		isExpanded,
		badge
	}: { 
		id: string; 
		icon: any; 
		title: string; 
		children: React.ReactNode;
		isExpanded: boolean;
		badge?: React.ReactNode;
	}) => (
		<div className="border-b border-border last:border-0">
			<button
				onClick={() => toggleSection(id)}
				className="w-full flex items-center justify-between py-3 px-0 hover:bg-transparent transition-colors"
			>
				<div className="flex items-center gap-2">
					<Icon className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm font-medium text-foreground">{title}</span>
					{badge}
				</div>
				{isExpanded ? (
					<ChevronUp className="w-4 h-4 text-muted-foreground" />
				) : (
					<ChevronDown className="w-4 h-4 text-muted-foreground" />
				)}
			</button>
			{isExpanded && (
				<div className="pb-3 space-y-2">
					{children}
				</div>
			)}
		</div>
	);

	return (
		<Card className={`top-20 h-fit ${isMobile ? "border-0 shadow-none" : ""}`}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-semibold flex items-center gap-2">
						<Filter className="w-4 h-4" />
						Filters
					</CardTitle>
					{activeFilterCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearFilters}
							className="h-7 text-xs text-muted-foreground hover:text-foreground"
						>
							Clear all
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{/* Search - Hidden on mobile since we have a dedicated mobile search bar at the top */}
				{!isMobile && (
					<div className="px-6 pb-4 border-b border-border">
						<Label htmlFor="search" className="text-sm font-medium flex items-center gap-2 mb-2">
							<Search className="w-4 h-4" />
							Search Events
						</Label>
						<Input
							id="search"
							placeholder="Search by name, venue..."
							value={searchQuery}
							onChange={(e) => {
								const value = e.target.value;
								setSearchQuery(value);
								scheduleQueryUpdate(value);
							}}
							className="w-full"
						/>
					</div>
				)}

				{/* Filter Sections */}
				<div className="px-6 py-4 space-y-0">
					{/* Popular Events */}
					<FilterSection
						id="popularEvents"
						icon={Flame}
						title="Popular Events"
						isExpanded={expandedSections.popularEvents}
						badge={filters.popularEvents ? (
							<Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary border-primary/20 flex items-center gap-1 px-1.5 py-0.5 h-5">
								<Flame className="w-3 h-3" />
							</Badge>
						) : undefined}
					>
						<label className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2">
							<Checkbox
								checked={filters.popularEvents}
								onCheckedChange={(checked) => {
									updateFilter("popularEvents", checked === true);
								}}
							/>
							<span className="text-sm flex-1">Show only popular events</span>
						</label>
					</FilterSection>

					{/* Event Status */}
					<FilterSection
						id="eventStatus"
						icon={CircleDot}
						title="Event Status"
						isExpanded={expandedSections.eventStatus}
					>
						{eventStatuses.length === 0 ? (
							<div className="text-sm text-muted-foreground py-2">No statuses available</div>
						) : (
							eventStatuses.map((status) => (
								<label
									key={status.value}
									className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
								>
									<Checkbox
										checked={filters.eventStatus.includes(status.value)}
										onCheckedChange={() => toggleFilterArray("eventStatus", status.value)}
									/>
									<span className="text-sm flex-1">{status.label}</span>
									{status.count !== undefined && status.count > 0 && (
										<span className="text-xs text-muted-foreground">({status.count})</span>
									)}
								</label>
							))
						)}
					</FilterSection>

					{/* Sport */}
					{!hiddenFilters.includes("sport") && (
						<FilterSection
							id="sport"
							icon={Activity}
							title="Sport"
							isExpanded={expandedSections.sport}
						>
						<div className="max-h-40 overflow-y-auto overflow-x-hidden">
							{loading.sports ? (
								<div className="text-sm text-muted-foreground py-2">Loading...</div>
							) : sports.length === 0 ? (
								<div className="text-sm text-muted-foreground py-2">No sports found</div>
							) : (
								sports.map((s) => (
									<label
										key={s.value}
										className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
									>
										<Checkbox
											checked={filters.sportType.includes(s.value)}
											onCheckedChange={() => toggleFilterArray("sportType", s.value)}
										/>
										<span className="text-sm flex-1">{s.label}</span>
										{s.count !== undefined && (
											<span className="text-xs text-muted-foreground">({s.count})</span>
										)}
									</label>
								))
							)}
							</div>
						</FilterSection>
					)}

					{/* Country */}
					<FilterSection
						id="country"
						icon={Globe}
						title="Country"
						isExpanded={expandedSections.country}
					>
						<div className="max-h-40 overflow-y-auto overflow-x-hidden">
						{loading.countries ? (
							<div className="text-sm text-muted-foreground py-2">Loading...</div>
						) : countries.length === 0 ? (
							<div className="text-sm text-muted-foreground py-2">No countries found</div>
						) : (
							countries.map((c) => (
								<label
									key={c.value}
									className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
								>
									<Checkbox
										checked={filters.countryCode.includes(c.value)}
										onCheckedChange={() => toggleFilterArray("countryCode", c.value)}
									/>
									<div className="flex items-center gap-2 flex-1">
										<CountryFlag countryCode={c.value} size={16} className="shrink-0" />
										<span className="text-sm flex-1">{c.label}</span>
										{c.count !== undefined && (
											<span className="text-xs text-muted-foreground">({c.count})</span>
										)}
									</div>
								</label>
							))
						)}
					</div>
					</FilterSection>

					{/* City */}
					<FilterSection
						id="city"
						icon={Building2}
						title="City"
						isExpanded={expandedSections.city}
					>
						<div className="max-h-40 overflow-y-auto overflow-x-hidden">
						{loading.cities ? (
							<div className="text-sm text-muted-foreground py-2">Loading...</div>
						) : cities.length === 0 ? (
							<div className="text-sm text-muted-foreground py-2">No cities found</div>
						) : (
							<>
								{(showAll.city ? cities : cities.slice(0, 10)).map((city) => (
									<label
										key={city.value}
										className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
									>
										<Checkbox
											checked={filters.city.includes(city.value)}
											onCheckedChange={() => toggleFilterArray("city", city.value)}
										/>
										<span className="text-sm flex-1">{city.label}</span>
										{city.count !== undefined && (
											<span className="text-xs text-muted-foreground">({city.count})</span>
										)}
									</label>
								))}
								{cities.length > 10 && !showAll.city && (
									<button
										onClick={() => setShowAll(prev => ({ ...prev, city: true }))}
										className="text-sm text-primary hover:underline mt-1"
									>
										Show all ({cities.length})
									</button>
								)}
							</>
						)}
						</div>
					</FilterSection>

					{/* Competition (Tournaments) */}
					<FilterSection
						id="competition"
						icon={Trophy}
						title="Competition"
						isExpanded={expandedSections.competition}
					>
						<div className="max-h-40 overflow-y-auto overflow-x-hidden">
						{loading.tournaments ? (
							<div className="text-sm text-muted-foreground py-2">Loading...</div>
						) : tournaments.length === 0 ? (
							<div className="text-sm text-muted-foreground py-2">
								No competitions available for the current filters
							</div>
						) : (
							tournaments.map((t) => (
								<label
									key={t.value}
									className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
								>
									<Checkbox
										checked={filters.tournamentId.includes(t.value)}
										onCheckedChange={() => toggleFilterArray("tournamentId", t.value)}
									/>
									<span className="text-sm flex-1">{t.label}</span>
									{t.count !== undefined && (
										<span className="text-xs text-muted-foreground">({t.count})</span>
									)}
								</label>
							))
						)}
						</div>
					</FilterSection>

					{/* Venue */}
					<FilterSection
						id="venue"
						icon={Landmark}
						title="Venue"
						isExpanded={expandedSections.venue}
					>
						<div className="max-h-40 overflow-y-auto overflow-x-hidden">
						{loading.venues ? (
							<div className="text-sm text-muted-foreground py-2">Loading...</div>
						) : venues.length === 0 ? (
							<div className="text-sm text-muted-foreground py-2">No venues found</div>
						) : (
							<>
								{(showAll.venue ? venues : venues.slice(0, 3)).map((venue) => (
									<label
										key={venue.value}
										className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
									>
										<Checkbox
											checked={filters.venue.includes(venue.value)}
											onCheckedChange={() => toggleFilterArray("venue", venue.value)}
										/>
										<span className="text-sm flex-1">{venue.label}</span>
										{venue.count !== undefined && (
											<span className="text-xs text-muted-foreground">({venue.count})</span>
										)}
									</label>
								))}
								{venues.length > 3 && !showAll.venue && (
									<button
										onClick={() => setShowAll(prev => ({ ...prev, venue: true }))}
										className="text-sm text-primary hover:underline mt-1"
									>
										Show all ({venues.length})
									</button>
								)}
							</>
						)}
						</div>
					</FilterSection>

					{/* Price */}
					<FilterSection
						id="price"
						icon={DollarSign}
						title="Price"
						isExpanded={expandedSections.price}
					>
						<div className="space-y-4">
							<Slider
								value={priceRange}
								onValueChange={(value) => {
									const [facetMin, facetMax] = priceRangeFromFacets;
									const clamped: [number, number] = [
										Math.max(facetMin, Math.min(facetMax, value[0] ?? facetMin)),
										Math.max(facetMin, Math.min(facetMax, value[1] ?? facetMax)),
									];
									setPriceRange(clamped);
									updateFilter("priceMin", clamped[0]);
									updateFilter("priceMax", clamped[1]);
								}}
								min={priceRangeFromFacets[0]}
								max={priceRangeFromFacets[1]}
								step={1}
								className="w-full"
							/>
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-1">
									<Label htmlFor="priceMin" className="text-xs text-muted-foreground">
										Min
									</Label>
									<Input
										id="priceMin"
										type="number"
										value={priceRange[0]}
										onChange={(e) => {
											const [facetMin, facetMax] = priceRangeFromFacets;
											const raw = parseInt(e.target.value);
											const val = Math.max(facetMin, Math.min(facetMax, Number.isNaN(raw) ? facetMin : raw));
											const nextMax = Math.max(val, priceRange[1]);
											setPriceRange([val, nextMax]);
											updateFilter("priceMin", val);
											updateFilter("priceMax", nextMax);
										}}
										className="w-full"
										min={priceRangeFromFacets[0]}
										max={priceRangeFromFacets[1]}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="priceMax" className="text-xs text-muted-foreground">
										Max
									</Label>
									<Input
										id="priceMax"
										type="number"
										value={priceRange[1]}
										onChange={(e) => {
											const [facetMin, facetMax] = priceRangeFromFacets;
											const raw = parseInt(e.target.value);
											const val = Math.max(facetMin, Math.min(facetMax, Number.isNaN(raw) ? facetMax : raw));
											const nextMin = Math.min(priceRange[0], val);
											setPriceRange([nextMin, val]);
											updateFilter("priceMin", nextMin);
											updateFilter("priceMax", val);
										}}
										className="w-full"
										min={priceRangeFromFacets[0]}
										max={priceRangeFromFacets[1]}
										step={1}
									/>
								</div>
							</div>
						</div>
					</FilterSection>
				</div>
			</CardContent>
		</Card>
	);
}
