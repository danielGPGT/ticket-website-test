"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

type FilterState = {
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
	eventStatus: string[]; // "on_sale", "coming_soon", "sales_closed", "not_confirmed"
};

type FilterOption = {
	value: string;
	label: string;
	count?: number;
};

type EventsFiltersProps = {
	onFilterChange: (filters: FilterState) => void;
	initialFilters?: Partial<FilterState>;
	events?: any[]; // Current events for dynamic counts
	isMobile?: boolean; // If true, remove border and shadow for mobile drawer
};

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

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

export function EventsFilters({ onFilterChange, initialFilters = {}, events = [], isMobile = false }: EventsFiltersProps) {
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
	const debouncedSearchQuery = useDebounce(searchQuery, 500);

	// Price range state
	const [priceRange, setPriceRange] = useState<[number, number]>([
		filters.priceMin || 0,
		filters.priceMax || 10000,
	]);

	// Sync filters when initialFilters change
	useEffect(() => {
		setFilters({
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
		setSearchQuery(initialFilters.query || "");
		setPriceRange([
			initialFilters.priceMin ?? 0,
			initialFilters.priceMax ?? 10000,
		]);
	}, [initialFilters]);

	// Sync debounced search query
	useEffect(() => {
		if (debouncedSearchQuery !== filters.query) {
			console.log("[EventsFilters] Search query changed:", debouncedSearchQuery);
			setFilters((prev) => {
				const newFilters = { ...prev, query: debouncedSearchQuery };
				onFilterChange(newFilters);
				return newFilters;
			});
		}
	}, [debouncedSearchQuery, filters.query, onFilterChange]);

	// Load sports from events (no API call needed)
	useEffect(() => {
		if (events.length === 0) {
			setSports([]);
			return;
		}
		
		setLoading(prev => ({ ...prev, sports: true }));
		
		// Extract unique sports from events
		const sportMap = new Map<string, number>();
		
		events.forEach((e: any) => {
			const sportType = String(e.sport_type ?? "").trim().toLowerCase();
			if (!sportType) return;
			
			sportMap.set(sportType, (sportMap.get(sportType) || 0) + 1);
		});
		
		// Convert to array with formatted names
		const list: FilterOption[] = Array.from(sportMap.entries()).map(([sportType, count]) => ({
			value: sportType,
			label: formatSportType(sportType),
			count: count
		}));
		
		// Sort alphabetically
		list.sort((a, b) => a.label.localeCompare(b.label));
		
		console.log("[EventsFilters] Extracted", list.length, "sports from events:", list.map(s => s.label));
		setSports(list);
		setLoading(prev => ({ ...prev, sports: false }));
	}, [events]);

	// Load tournaments from events (no sport selection required)
	useEffect(() => {
		if (events.length === 0) {
			setTournaments([]);
			return;
		}
		
		setLoading(prev => ({ ...prev, tournaments: true }));
		
		// Extract unique tournaments from events
		const tournamentMap = new Map<string, { name: string; season: string; count: number }>();
		
		events.forEach((e: any) => {
			const tournamentId = String(e.tournament_id ?? "").trim();
			if (!tournamentId) return;
			
			const tournamentName = String(e.tournament_name ?? e.tournament ?? "").trim();
			const season = e.season ? String(e.season) : "";
			
			if (tournamentMap.has(tournamentId)) {
				const existing = tournamentMap.get(tournamentId)!;
				existing.count++;
				// Update name if we have a better one
				if (tournamentName && !existing.name) {
					existing.name = tournamentName;
				}
				// Update season if we have a better one
				if (season && !existing.season) {
					existing.season = season;
				}
			} else {
				tournamentMap.set(tournamentId, {
					name: tournamentName || tournamentId,
					season: season,
					count: 1
				});
			}
		});
		
		// Convert to array
		const list: FilterOption[] = Array.from(tournamentMap.entries()).map(([id, data]) => ({
			value: id,
			label: `${data.name}${data.season ? ` (${data.season})` : ""}`,
			count: data.count
		}));
		
		// Sort by count (most events first), then by season (current first), then name
		const currentYear = new Date().getFullYear();
		list.sort((a, b) => {
			// First sort by count (descending)
			if (a.count !== b.count) {
				return (b.count ?? 0) - (a.count ?? 0);
			}
			// Then by season (current first)
			const aSeason = parseInt(a.label.match(/\((\d{4})/)?.[1] || "0");
			const bSeason = parseInt(b.label.match(/\((\d{4})/)?.[1] || "0");
			if (aSeason === currentYear && bSeason !== currentYear) return -1;
			if (bSeason === currentYear && aSeason !== currentYear) return 1;
			if (aSeason !== bSeason) return bSeason - aSeason;
			// Finally by name
			return a.label.localeCompare(b.label);
		});
		
		console.log("[EventsFilters] Extracted", list.length, "tournaments from events");
		setTournaments(list);
		setLoading(prev => ({ ...prev, tournaments: false }));
	}, [events]);

	// Load countries, cities, and venues dynamically from events
	useEffect(() => {
		if (!events.length) {
			// Load from API if no events
			setLoading(prev => ({ ...prev, countries: true }));
			fetch("/api/xs2/countries?page_size=300")
				.then((r) => r.json())
				.then((d) => {
					const raw = (d.countries ?? d.results ?? []) as any[];
					const seen = new Set<string>();
					const list: FilterOption[] = [];
					
					raw.forEach((c) => {
						const code = String(c.iso_country ?? c.country ?? c.iso3 ?? "").trim().toUpperCase();
						if (!code || code.length < 2 || seen.has(code)) return;
						seen.add(code);
						
						const name = String(c.name ?? c.country_name ?? code).trim();
						if (!name) return;
						
						list.push({ value: code, label: name });
					});
					
					setCountries(list.sort((a, b) => a.label.localeCompare(b.label)));
				})
				.finally(() => setLoading(prev => ({ ...prev, countries: false })));
			return;
		}

		// Extract unique countries, cities, and venues from events
		const countryMap = new Map<string, number>();
		const cityMap = new Map<string, number>();
		const venueMap = new Map<string, number>();

		events.forEach((e: any) => {
			const countryCode = String(e.iso_country ?? e.country ?? "").trim().toUpperCase();
			if (countryCode && countryCode.length >= 2) {
				countryMap.set(countryCode, (countryMap.get(countryCode) || 0) + 1);
			}

			const city = String(e.city ?? "").trim();
			if (city) {
				cityMap.set(city, (cityMap.get(city) || 0) + 1);
			}

			const venue = String(e.venue_name ?? e.venue ?? "").trim();
			if (venue) {
				venueMap.set(venue, (venueMap.get(venue) || 0) + 1);
			}
		});

		// Convert to arrays
		const countryList: FilterOption[] = Array.from(countryMap.entries())
			.map(([code, count]) => ({
				value: code,
				label: code, // Will be replaced with country name lookup
				count,
			}))
			.sort((a, b) => b.count! - a.count!);

		const cityList: FilterOption[] = Array.from(cityMap.entries())
			.map(([city, count]) => ({
				value: city,
				label: city,
				count,
			}))
			.sort((a, b) => b.count! - a.count!);

		const venueList: FilterOption[] = Array.from(venueMap.entries())
			.map(([venue, count]) => ({
				value: venue,
				label: venue,
				count,
			}))
			.sort((a, b) => b.count! - a.count!);

		setCountries(countryList);
		setCities(cityList);
		setVenues(venueList);

		// Calculate event status counts
		const statusMap = new Map<string, number>();
		
		events.forEach((e: any) => {
			const eventStatus = String(e.event_status ?? "").trim().toLowerCase();
			const numberOfTickets = e.number_of_tickets ?? 0;
			
			// Determine actual status based on event_status and ticket availability
			// Same logic as EventCardHorizontal
			let actualStatus: string;
			
			if (eventStatus === "soldout" || eventStatus === "closed") {
				actualStatus = "sales_closed";
			} else if (eventStatus === "cancelled" || eventStatus === "postponed") {
				actualStatus = "not_confirmed";
			} else if (eventStatus === "notstarted" || eventStatus === "nosale") {
				actualStatus = numberOfTickets > 0 ? "on_sale" : "coming_soon";
			} else {
				// Default: check if tickets available
				actualStatus = numberOfTickets > 0 ? "on_sale" : "coming_soon";
			}
			
			statusMap.set(actualStatus, (statusMap.get(actualStatus) || 0) + 1);
		});

		const statusList: FilterOption[] = [
			{ value: "on_sale", label: "On Sale", count: statusMap.get("on_sale") || 0 },
			{ value: "coming_soon", label: "Coming Soon", count: statusMap.get("coming_soon") || 0 },
			{ value: "sales_closed", label: "Sales Closed", count: statusMap.get("sales_closed") || 0 },
			{ value: "not_confirmed", label: "Not Confirmed", count: statusMap.get("not_confirmed") || 0 },
		].filter(s => s.count > 0); // Only show statuses that have events

		setEventStatuses(statusList);
	}, [events]);

	// Calculate price range from events
	const priceRangeFromEvents = useMemo(() => {
		if (!events.length) return [0, 10000];
		
		const prices = events
			.map(e => e.min_ticket_price_eur ?? e.min_price_eur ?? 0)
			.filter(p => p > 0)
			.map(p => p > 1000 ? p / 100 : p); // Convert cents to euros if needed
		
		if (prices.length === 0) return [0, 10000];
		
		const min = Math.floor(Math.min(...prices));
		const max = Math.ceil(Math.max(...prices));
		return [min, max];
	}, [events]);

	// Update filters and notify parent
	const updateFilter = useCallback((key: keyof FilterState, value: any) => {
		setFilters((prev) => {
			const newFilters = { ...prev, [key]: value };
			onFilterChange(newFilters);
			return newFilters;
		});
	}, [onFilterChange]);

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
		const cleared: FilterState = {
			sportType: [],
			tournamentId: [],
			countryCode: [],
			city: [],
			venue: [],
			dateFrom: "",
			dateTo: "",
			priceMin: 0,
			priceMax: priceRangeFromEvents[1],
			query: "",
			popularEvents: false,
			eventStatus: [],
		};
		setFilters(cleared);
		setSearchQuery("");
		setPriceRange([priceRangeFromEvents[0], priceRangeFromEvents[1]]);
		onFilterChange(cleared);
	};

	const activeFilterCount = 
		filters.sportType.length +
		filters.tournamentId.length +
		filters.countryCode.length +
		filters.city.length +
		filters.venue.length +
		(filters.dateFrom ? 1 : 0) +
		(filters.dateTo ? 1 : 0) +
		(filters.priceMin > priceRangeFromEvents[0] || filters.priceMax < priceRangeFromEvents[1] ? 1 : 0) +
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
				{/* Search */}
				<div className="px-6 pb-4 border-b border-border">
					<Label htmlFor="search" className="text-sm font-medium flex items-center gap-2 mb-2">
						<Search className="w-4 h-4" />
						Search Events
					</Label>
					<Input
						id="search"
						placeholder="Search by name, venue..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full"
					/>
				</div>

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
					<FilterSection
						id="sport"
						icon={Activity}
						title="Sport"
						isExpanded={expandedSections.sport}
					>
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
					</FilterSection>

					{/* Country */}
					<FilterSection
						id="country"
						icon={Globe}
						title="Country"
						isExpanded={expandedSections.country}
					>
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
					</FilterSection>

					{/* City */}
					<FilterSection
						id="city"
						icon={Building2}
						title="City"
						isExpanded={expandedSections.city}
					>
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
					</FilterSection>

					{/* Competition (Tournaments) */}
					<FilterSection
						id="competition"
						icon={Trophy}
						title="Competition"
						isExpanded={expandedSections.competition}
					>
						{loading.tournaments ? (
							<div className="text-sm text-muted-foreground py-2">Loading...</div>
						) : tournaments.length === 0 ? (
							<div className="text-sm text-muted-foreground py-2">
								{events.length === 0 ? "No events loaded yet" : "No tournaments found in current events"}
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
					</FilterSection>

					{/* Venue */}
					<FilterSection
						id="venue"
						icon={Landmark}
						title="Venue"
						isExpanded={expandedSections.venue}
					>
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
									setPriceRange(value as [number, number]);
									updateFilter("priceMin", value[0]);
									updateFilter("priceMax", value[1]);
								}}
								min={priceRangeFromEvents[0]}
								max={priceRangeFromEvents[1]}
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
											const val = parseInt(e.target.value) || priceRangeFromEvents[0];
											setPriceRange([val, priceRange[1]]);
											updateFilter("priceMin", val);
										}}
										className="w-full"
										min={priceRangeFromEvents[0]}
										max={priceRangeFromEvents[1]}
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
											const val = parseInt(e.target.value) || priceRangeFromEvents[1];
											setPriceRange([priceRange[0], val]);
											updateFilter("priceMax", val);
										}}
										className="w-full"
										min={priceRangeFromEvents[0]}
										max={priceRangeFromEvents[1]}
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
