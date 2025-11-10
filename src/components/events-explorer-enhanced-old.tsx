"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EventCardHorizontal } from "@/components/event-card-horizontal";
import { EventsFilters } from "@/components/events-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Loader2, Filter } from "lucide-react";
import { normalizeToIso3 } from "@/lib/country-flags";

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
	eventStatus: string[];
};

export function EventsExplorerEnhanced() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [allEvents, setAllEvents] = useState<any[]>([]); // All fetched events
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [showAll, setShowAll] = useState(false);
	const eventsPerPage = 36; // Show 36 events per page

	// Parse filters from URL - support both single and array values
	const filters: FilterState = useMemo(() => {
		const getArrayParam = (key: string): string[] => {
			const param = searchParams.get(key);
			if (!param) return [];
			// Support comma-separated values or single value
			return param.includes(",") ? param.split(",").filter(Boolean) : [param];
		};
		
		return {
			sportType: getArrayParam("sport_type"),
			tournamentId: getArrayParam("tournament_id"),
			countryCode: getArrayParam("country"), // XS2 API uses "country" not "iso_country"
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
	const showAllEvents = origin === "allevents"; // Only show all events if explicitly requested

	// Fetch events based on filters with pagination
	useEffect(() => {
		setLoading(true);
		setCurrentPage(1);
		
		const today = new Date().toISOString().split("T")[0];
		
		// Helper function to fetch all pages for a single request
		const fetchAllPages = async (baseUrl: string): Promise<any[]> => {
			const all: any[] = [];
			let url: string | null = baseUrl;
			let pageCount = 0;
			const maxPages = 100; // Safety limit
			
			while (url && pageCount < maxPages) {
				try {
					const res: Response = await fetch(url);
					if (!res.ok) {
						console.warn("[EventsExplorer] Non-OK response", res.status, res.statusText);
						break;
					}
					
					const data: any = await res.json();
					const items = Array.isArray(data) ? data : (data.events ?? data.results ?? data.items ?? []);
					
					if (items.length === 0) {
						console.log("[EventsExplorer] No more items on page", pageCount + 1);
						break; // No more items
					}
					
					all.push(...items);
					console.log("[EventsExplorer] Page", pageCount + 1, "- received", items.length, "events (total:", all.length, ")");
					
					// Check for next page
					const pagination: any = data.pagination;
					const nextPage: string | null = pagination?.next_page;
					
					if (!nextPage || nextPage === "string" || nextPage === url) {
						url = null; // No more pages
					} else if (nextPage.startsWith("http")) {
						// Full URL - convert to our API route
						const nextUrl: URL = new URL(nextPage);
						const nextParams: URLSearchParams = new URLSearchParams(nextUrl.searchParams);
						nextParams.set("origin", "allevents");
						url = `/api/xs2/events?${nextParams.toString()}`;
					} else {
						// Try to construct URL from next_page
						try {
							const nextUrl: URL = new URL(nextPage, "https://api.xs2event.com/v1/");
							const nextParams: URLSearchParams = new URLSearchParams(nextUrl.searchParams);
							nextParams.set("origin", "allevents");
							url = `/api/xs2/events?${nextParams.toString()}`;
						} catch {
							// If next_page is just query params, use it directly
							if (nextPage.includes("=")) {
								const nextParams: URLSearchParams = new URLSearchParams(nextPage);
								nextParams.set("origin", "allevents");
								url = `/api/xs2/events?${nextParams.toString()}`;
							} else {
								url = null;
							}
						}
					}
					
					pageCount++;
				} catch (error) {
					console.error("[EventsExplorer] Pagination error:", error);
					break;
				}
			}
			
			console.log("[EventsExplorer] Fetched", pageCount, "pages,", all.length, "total events");
			return all;
		};

		// Helper function to build a single API request URL
		const buildRequestUrl = (sportType?: string, tournamentId?: string, countryCode?: string): string => {
			const qs = new URLSearchParams();
			
			// Add primary filters (only one of each type per request)
			if (sportType) {
				qs.set("sport_type", sportType);
			}
			if (tournamentId) {
				qs.set("tournament_id", tournamentId);
			}
			if (countryCode) {
				// XS2 API uses "country" parameter (not "iso_country") and expects ISO 3 format
				const iso3Code = normalizeToIso3(countryCode);
				if (iso3Code) {
					qs.set("country", iso3Code);
				}
			}
			if (teamId && teamId.trim()) {
				qs.set("team_id", teamId.trim());
			}
			// XS2 API uses "event_name" parameter for search (not "query")
			if (filters.query && filters.query.trim()) {
				qs.set("event_name", filters.query.trim());
			}
			
			// Handle date filters
			if (filters.dateFrom && filters.dateFrom.trim()) {
				qs.set("date_start", `ge:${filters.dateFrom.trim()}`);
			}
			if (filters.dateTo && filters.dateTo.trim()) {
				qs.set("date_stop", `le:${filters.dateTo.trim()}`);
			}
			
			// Only apply default future events filter if not showing all events and no date filters
			// But only if we have sport_type (XS2 API might reject date_stop with tournament_id alone)
			if (!showAllEvents && !filters.dateFrom && !filters.dateTo) {
				const hasOtherFilters = sportType || tournamentId || countryCode || teamId || filters.query;
				if (hasOtherFilters && sportType) {
					// Only add date filter if we have sport_type
					qs.set("date_stop", `ge:${today}`);
				}
			}
			
			// Add popular events filter if enabled
			if (filters.popularEvents) {
				qs.set("popular_events", "true");
			}
			
			// Always add page parameters
			qs.set("page_size", "100");
			qs.set("page", "1");
			qs.set("origin", "allevents");
			
			return `/api/xs2/events?${qs.toString()}`;
		};

		// Determine what requests we need to make
		// XS2 API might not support comma-separated values, so we need to make separate requests
		// and combine results if multiple values are selected
		
		const hasFilters = filters.sportType.length > 0 || filters.tournamentId.length > 0 || filters.countryCode.length > 0 || teamId || filters.query || filters.dateFrom || filters.dateTo;
		
		// Build requests for all combinations
		// XS2 API doesn't support comma-separated values, so we make separate requests
		const requests: Promise<any[]>[] = [];
		
		// If no filters are selected at all, show popular events by default
		if (!hasFilters) {
			console.log("[EventsExplorer] No filters selected - fetching popular sports by default");
			// Fetch popular sports to show something useful
			const popularSports = ["formula1", "football", "tennis", "motogp"];
			for (const sport of popularSports) {
				const url = buildRequestUrl(sport);
				console.log("[EventsExplorer] Adding default request for sport:", sport);
				requests.push(fetchAllPages(url));
			}
		}
		
		console.log("[EventsExplorer] Filter state:", {
			sportType: filters.sportType,
			tournamentId: filters.tournamentId,
			countryCode: filters.countryCode,
			city: filters.city,
			venue: filters.venue,
			query: filters.query,
			dateFrom: filters.dateFrom,
			dateTo: filters.dateTo,
			teamId,
			hasFilters,
			showAllEvents
		});
		
		if (filters.sportType.length > 0) {
			// Make a request for each sport type
			// If multiple countries selected, make separate requests for each sport+country combination
			if (filters.countryCode.length > 0) {
				for (const sport of filters.sportType) {
					for (const country of filters.countryCode) {
						const url = buildRequestUrl(sport, undefined, country);
						console.log("[EventsExplorer] Adding request for sport:", sport, "country:", country);
						requests.push(fetchAllPages(url));
					}
				}
			} else {
				// No country filter, just sport
				for (const sport of filters.sportType) {
					const url = buildRequestUrl(sport, undefined, undefined);
					console.log("[EventsExplorer] Adding request for sport:", sport);
					requests.push(fetchAllPages(url));
				}
			}
		} else if (filters.tournamentId.length > 0) {
			// Make a request for each tournament
			for (const tournament of filters.tournamentId) {
				const url = buildRequestUrl(undefined, tournament, filters.countryCode[0]);
				console.log("[EventsExplorer] Adding request for tournament:", tournament);
				requests.push(fetchAllPages(url));
			}
		} else if (filters.countryCode.length > 0) {
			// Make a request for each country
			for (const country of filters.countryCode) {
				const url = buildRequestUrl(undefined, undefined, country);
				console.log("[EventsExplorer] Adding request for country:", country);
				requests.push(fetchAllPages(url));
			}
		} else if (teamId || filters.query || filters.dateFrom || filters.dateTo) {
			// Team, query, or date - single request
			const url = buildRequestUrl();
			console.log("[EventsExplorer] Adding request for team/query/date");
			requests.push(fetchAllPages(url));
		}

		// If no valid requests after all checks, show empty state
		if (requests.length === 0) {
			console.log("[EventsExplorer] No requests to make - showing empty state");
			setAllEvents([]);
			setLoading(false);
			return;
		}

		console.log("[EventsExplorer] Making", requests.length, "API request(s)");

		// Fetch all requests and combine results
		Promise.all(requests)
			.then((resultsArrays) => {
				// Combine all results and deduplicate by event ID
				const allItems: any[] = [];
				const seenIds = new Set<string>();
				
				resultsArrays.flat().forEach((item: any) => {
					const id = String(item.id ?? item.event_id ?? "").trim();
					if (!id || seenIds.has(id)) return;
					seenIds.add(id);
					allItems.push(item);
				});
				
				console.log("[EventsExplorer] Total received", allItems.length, "events (after deduplication)");
				
				// Apply client-side filters (price, city, venue, and multiple selections)
				let filtered = allItems;
				
				// Filter by selected sport types (if multiple selected)
				if (filters.sportType.length > 0) {
					filtered = filtered.filter((e: any) => {
						const eventSportType = String(e.sport_type ?? "").trim().toLowerCase();
						return filters.sportType.some(s => s.toLowerCase() === eventSportType);
					});
				}
				
				// Filter by selected tournaments (if multiple selected)
				if (filters.tournamentId.length > 0) {
					filtered = filtered.filter((e: any) => {
						const eventTournamentId = String(e.tournament_id ?? e.id ?? "").trim();
						return filters.tournamentId.includes(eventTournamentId);
					});
				}
				
				// Filter by selected countries (if multiple selected)
				// Note: We need to normalize both the filter codes and event country codes
				if (filters.countryCode.length > 0) {
					const normalizedFilterCodes = filters.countryCode.map(code => normalizeToIso3(code)).filter((code): code is string => code !== null);
					filtered = filtered.filter((e: any) => {
						const eventCountry = String(e.iso_country ?? e.country ?? "").trim().toUpperCase();
						// Normalize event country to ISO 3 for comparison
						const normalizedEventCountry = normalizeToIso3(eventCountry);
						return normalizedFilterCodes.includes(normalizedEventCountry || "");
					});
				}
				
				// Price filter
				if (filters.priceMin > 0 || filters.priceMax < 10000) {
					filtered = filtered.filter((e: any) => {
						const price = e.min_ticket_price_eur ?? e.min_price_eur ?? 0;
						const priceInEuros = price > 1000 ? price / 100 : price;
						if (filters.priceMin > 0 && priceInEuros < filters.priceMin) return false;
						if (filters.priceMax < 10000 && priceInEuros > filters.priceMax) return false;
						return true;
					});
				}
				
				// City filter
				if (filters.city.length > 0) {
					filtered = filtered.filter((e: any) => {
						const city = String(e.city ?? "").trim();
						return filters.city.includes(city);
					});
				}
				
				// Venue filter
				if (filters.venue.length > 0) {
					filtered = filtered.filter((e: any) => {
						const venue = String(e.venue_name ?? e.venue ?? "").trim();
						return filters.venue.includes(venue);
					});
				}
				
				// Event Status filter
				if (filters.eventStatus.length > 0) {
					filtered = filtered.filter((e: any) => {
						const eventStatus = String(e.event_status ?? "").trim().toLowerCase();
						const numberOfTickets = e.number_of_tickets ?? 0;
						
						// Determine actual status based on event_status and ticket availability
						// Same logic as EventCardHorizontal and EventsFilters
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
						
						return filters.eventStatus.includes(actualStatus);
					});
				}
				
				console.log("[EventsExplorer] After filtering:", filtered.length, "events");
				
				// Sort events by date (earliest first)
				filtered.sort((a: any, b: any) => {
					const dateA = a.date_start ?? a.date_start_main_event ?? a.date_stop ?? "";
					const dateB = b.date_start ?? b.date_start_main_event ?? b.date_stop ?? "";
					if (!dateA && !dateB) return 0;
					if (!dateA) return 1; // Events without dates go to end
					if (!dateB) return -1;
					return new Date(dateA).getTime() - new Date(dateB).getTime();
				});
				
				setAllEvents(filtered);
				setCurrentPage(1); // Reset to first page when filters change
			})
			.catch((error) => {
				console.error("[EventsExplorer] Fetch error:", error);
				setAllEvents([]);
			})
			.finally(() => setLoading(false));
	}, [filters, teamId, showAllEvents]);

	// Calculate pagination
	const totalEvents = allEvents.length;
	const totalPages = Math.ceil(totalEvents / eventsPerPage);
	const startIndex = showAll ? 0 : (currentPage - 1) * eventsPerPage;
	const endIndex = showAll ? totalEvents : startIndex + eventsPerPage;
	const displayedEvents = allEvents.slice(startIndex, endIndex);
	
	// Reset to first page when showAll changes
	useEffect(() => {
		if (showAll) {
			setCurrentPage(1);
		}
	}, [showAll]);

	const handleFilterChange = (newFilters: FilterState) => {
		console.log("[EventsExplorer] handleFilterChange called with:", newFilters);
		const params = new URLSearchParams();
		
		// Always start with origin=allevents as base
		params.set("origin", "allevents");
		
		// Add filters (arrays are joined with commas)
		if (newFilters.sportType.length > 0) {
			params.set("sport_type", newFilters.sportType.join(","));
			console.log("[EventsExplorer] Added sport_type:", newFilters.sportType.join(","));
		}
		if (newFilters.tournamentId.length > 0) {
			params.set("tournament_id", newFilters.tournamentId.join(","));
			console.log("[EventsExplorer] Added tournament_id:", newFilters.tournamentId.join(","));
		}
		if (newFilters.countryCode.length > 0) {
			// XS2 API uses "country" parameter (not "iso_country") and expects ISO 3 format
			const iso3Codes = newFilters.countryCode
				.map(code => normalizeToIso3(code))
				.filter((code): code is string => code !== null);
			if (iso3Codes.length > 0) {
				params.set("country", iso3Codes.join(","));
				console.log("[EventsExplorer] Added country (ISO 3):", iso3Codes.join(","));
			}
		}
		if (newFilters.city.length > 0) {
			params.set("city", newFilters.city.join(","));
			console.log("[EventsExplorer] Added city:", newFilters.city.join(","));
		}
		if (newFilters.venue.length > 0) {
			params.set("venue", newFilters.venue.join(","));
			console.log("[EventsExplorer] Added venue:", newFilters.venue.join(","));
		}
		if (newFilters.dateFrom) {
			params.set("date_from", newFilters.dateFrom);
			console.log("[EventsExplorer] Added date_from:", newFilters.dateFrom);
		}
		if (newFilters.dateTo) {
			params.set("date_to", newFilters.dateTo);
			console.log("[EventsExplorer] Added date_to:", newFilters.dateTo);
		}
		if (newFilters.priceMin > 0) {
			params.set("price_min", String(newFilters.priceMin));
			console.log("[EventsExplorer] Added price_min:", newFilters.priceMin);
		}
		if (newFilters.priceMax < 10000) {
			params.set("price_max", String(newFilters.priceMax));
			console.log("[EventsExplorer] Added price_max:", newFilters.priceMax);
		}
		if (newFilters.query) {
			params.set("query", newFilters.query);
			console.log("[EventsExplorer] Added query:", newFilters.query);
		}
		if (newFilters.popularEvents) {
			params.set("popular_events", "true");
			console.log("[EventsExplorer] Added popular_events: true");
		}
		if (newFilters.eventStatus.length > 0) {
			params.set("event_status", newFilters.eventStatus.join(","));
			console.log("[EventsExplorer] Added event_status:", newFilters.eventStatus.join(","));
		}
		
		const newUrl = `/events?${params.toString()}`;
		console.log("[EventsExplorer] Navigating to:", newUrl);
		console.log("[EventsExplorer] Full params:", Object.fromEntries(params));
		router.push(newUrl);
	};

	// Calculate active filter count for badge
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

	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

	return (
		<div className="relative">
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Filters Sidebar - Hidden on mobile, visible on desktop */}
				<aside className="hidden lg:block w-80 shrink-0">
					<EventsFilters onFilterChange={handleFilterChange} initialFilters={filters} events={allEvents} />
				</aside>

				{/* Events Grid */}
				<main className="flex-1 min-w-0 overflow-x-hidden">
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : allEvents.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-20 text-center">
							<p className="text-lg font-semibold text-foreground mb-2">No events found</p>
							<p className="text-sm text-muted-foreground mb-4 max-w-md">
								{filters.sportType.length === 0 && filters.tournamentId.length === 0 && filters.countryCode.length === 0 && !teamId && !filters.query && !filters.dateFrom && !filters.dateTo
									? "Select filters on the left to browse events, or search for a specific event."
									: "Try adjusting your filters to see more results. You can also try removing some filters or expanding your date range."}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => router.push("/events")}
								>
									Clear all filters
								</Button>
								<Button
									variant="default"
									onClick={() => router.push("/events?origin=allevents")}
								>
									Show all events
								</Button>
							</div>
						</CardContent>
					</Card>
				) : (
					<>
						<div className="mb-4 flex items-center justify-between flex-wrap gap-4">
							<div className="flex items-center gap-4">
								<div className="text-sm text-muted-foreground">
									{showAll ? (
										<>Showing all {totalEvents} {totalEvents === 1 ? "event" : "events"}</>
									) : (
										<>Showing {displayedEvents.length} of {totalEvents} {totalEvents === 1 ? "event" : "events"} (Page {currentPage} of {totalPages})</>
									)}
								</div>
								{totalEvents > eventsPerPage && (
									<Button
										variant={showAll ? "default" : "outline"}
										size="sm"
										onClick={() => {
											setShowAll(!showAll);
											setCurrentPage(1);
										}}
									>
										{showAll ? "Show Pages" : "Show All"}
									</Button>
								)}
							</div>
						</div>
						<div className="space-y-6">
							{displayedEvents.map((e) => {
								const countryCode = e.iso_country ?? e.country ?? e.venue_country ?? e.location?.country ?? e.location?.iso_country ?? null;
								const timeStart = e.date_start_main_event ?? e.date_start;
								const timeEnd = e.date_stop_main_event ?? e.date_stop;
								
								// Determine stock status based on event status
								// XS2 API event_status values: cancelled, closed, notstarted, nosale, postponed, soldout
								// We'll let the component handle the mapping, just pass the raw status
								
								return (
									<EventCardHorizontal
										key={e.id ?? e.event_id}
										id={String(e.id ?? e.event_id)}
										name={e.event_name ?? e.name ?? e.official_name ?? "Event"}
										date={e.date_start ?? e.date_start_main_event}
										dateEnd={e.date_stop ?? e.date_stop_main_event}
										timeStart={timeStart}
										timeEnd={timeEnd}
										venue={e.venue_name ?? e.venue}
										countryCode={countryCode}
										sportType={e.sport_type}
										tournamentName={e.tournament_name}
										tournamentSeason={e.season}
										city={e.city}
										minPrice={e.min_ticket_price_eur}
										maxPrice={e.max_ticket_price_eur}
										status={e.event_status as any}
										numberOfTickets={e.number_of_tickets}
										currency="£"
										isPopular={filters.popularEvents || e.is_popular === true || e.popular === true}
									/>
								);
							})}
						</div>
						
						{/* Pagination Controls */}
						{!showAll && totalPages > 1 && (
							<div className="mt-8 flex items-center justify-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
									disabled={currentPage === 1}
								>
									Previous
								</Button>
								
								{/* Page Numbers */}
								<div className="flex items-center gap-1">
									{Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
										let pageNum: number;
										if (totalPages <= 7) {
											pageNum = i + 1;
										} else if (currentPage <= 4) {
											pageNum = i + 1;
										} else if (currentPage >= totalPages - 3) {
											pageNum = totalPages - 6 + i;
										} else {
											pageNum = currentPage - 3 + i;
										}
										
										if (totalPages > 7 && i === 0 && currentPage > 4) {
											return (
												<React.Fragment key={`first-ellipsis-${i}`}>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setCurrentPage(1)}
														className="w-10"
													>
														1
													</Button>
													<span className="px-2 text-muted-foreground">...</span>
												</React.Fragment>
											);
										}
										
										if (totalPages > 7 && i === 6 && currentPage < totalPages - 3) {
											return (
												<React.Fragment key={`last-ellipsis-${i}`}>
													<span className="px-2 text-muted-foreground">...</span>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setCurrentPage(totalPages)}
														className="w-10"
													>
														{totalPages}
													</Button>
												</React.Fragment>
											);
										}
										
										return (
											<Button
												key={pageNum}
												variant={currentPage === pageNum ? "default" : "outline"}
												size="sm"
												onClick={() => setCurrentPage(pageNum)}
												className="w-10"
											>
												{pageNum}
											</Button>
										);
									})}
								</div>
								
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
									disabled={currentPage === totalPages}
								>
									Next
								</Button>
							</div>
						)}
						
					</>
				)}
			</main>
			</div>

			{/* Mobile Filters - Floating Button & Drawer */}
			<Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
				<DrawerTrigger asChild>
					<Button
						size="lg"
						className="lg:hidden fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
						aria-label="Open filters"
					>
						<Filter className="h-6 w-6" />
						{activeFilterCount > 0 && (
							<Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground rounded-full border-2 border-background">
								{activeFilterCount > 99 ? "99+" : activeFilterCount}
							</Badge>
						)}
					</Button>
				</DrawerTrigger>
				<DrawerContent className="!max-h-[90vh] p-0 bg-card">
					<div className="overflow-y-auto">
						<EventsFilters onFilterChange={handleFilterChange} initialFilters={filters} events={allEvents} isMobile={true} />
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}


