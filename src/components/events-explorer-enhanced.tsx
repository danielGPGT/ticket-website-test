"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { EventsFilters } from "@/components/events-filters";
import { VirtualEventsList } from "./events/virtual-events-list";
import { EventsListSkeleton } from "./events/event-card-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { useFilters } from "@/hooks/use-filters";
import { useEventsAPI } from "@/hooks/use-events-api";
import { useDebounce } from "@/hooks/use-debounce";
import { normalizeToIso3 } from "@/lib/country-flags";
import { usePathname } from "next/navigation";
import { getSportPath } from "@/lib/sport-routes";

type EventsExplorerEnhancedProps = {
	hiddenFilters?: string[];
};

export function EventsExplorerEnhanced({ hiddenFilters = [] }: EventsExplorerEnhancedProps) {
	const pathname = usePathname();
	const { filters, teamId, showAllEvents, updateFilters, clearFilters, activeFilterCount } = useFilters();
	const { fetchEvents, loading: apiLoading, error } = useEventsAPI();
	
	// Detect sport path from pathname
	const sportPath = getSportPath(filters.sportType[0] || null) || (pathname.startsWith("/formula-1") ? "/formula-1" : pathname.startsWith("/football") ? "/football" : pathname.startsWith("/motogp") ? "/motogp" : pathname.startsWith("/tennis") ? "/tennis" : null);
	
	const [allEvents, setAllEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [showAll, setShowAll] = useState(false);
	const [optimisticEvents, setOptimisticEvents] = useState<any[] | null>(null);
	
	const eventsPerPage = 36;

	// Debounce filter changes to avoid excessive API calls
	const debouncedFilters = useDebounce(filters, 300);

	// Fetch events when filters change
	useEffect(() => {
		let isMounted = true;

		const loadEvents = async () => {
			setLoading(true);
			setOptimisticEvents(null);

			try {
				const events = await fetchEvents(debouncedFilters, teamId, showAllEvents);
				
				if (!isMounted) return;

				// Apply client-side filters
				let filtered = events;

				// Filter by selected sport types (if multiple selected)
				if (debouncedFilters.sportType.length > 0) {
					filtered = filtered.filter((e: any) => {
						const eventSportType = String(e.sport_type ?? "").trim().toLowerCase();
						return debouncedFilters.sportType.some(s => s.toLowerCase() === eventSportType);
					});
				}

				// Filter by selected tournaments (if multiple selected)
				if (debouncedFilters.tournamentId.length > 0) {
					filtered = filtered.filter((e: any) => {
						const eventTournamentId = String(e.tournament_id ?? e.id ?? "").trim();
						return debouncedFilters.tournamentId.includes(eventTournamentId);
					});
				}

				// Filter by selected countries (if multiple selected)
				if (debouncedFilters.countryCode.length > 0) {
					const normalizedFilterCodes = debouncedFilters.countryCode
						.map(code => normalizeToIso3(code))
						.filter((code): code is string => code !== null);
					filtered = filtered.filter((e: any) => {
						const eventCountry = String(e.iso_country ?? e.country ?? "").trim().toUpperCase();
						const normalizedEventCountry = normalizeToIso3(eventCountry);
						return normalizedFilterCodes.includes(normalizedEventCountry || "");
					});
				}

				// Price filter
				if (debouncedFilters.priceMin > 0 || debouncedFilters.priceMax < 10000) {
					filtered = filtered.filter((e: any) => {
						const price = e.min_ticket_price_eur ?? e.min_price_eur ?? 0;
						const priceInEuros = price > 1000 ? price / 100 : price;
						if (debouncedFilters.priceMin > 0 && priceInEuros < debouncedFilters.priceMin) return false;
						if (debouncedFilters.priceMax < 10000 && priceInEuros > debouncedFilters.priceMax) return false;
						return true;
					});
				}

				// City filter
				if (debouncedFilters.city.length > 0) {
					filtered = filtered.filter((e: any) => {
						const city = String(e.city ?? "").trim();
						return debouncedFilters.city.includes(city);
					});
				}

				// Venue filter
				if (debouncedFilters.venue.length > 0) {
					filtered = filtered.filter((e: any) => {
						const venue = String(e.venue_name ?? e.venue ?? "").trim();
						return debouncedFilters.venue.includes(venue);
					});
				}

				// Event Status filter
				if (debouncedFilters.eventStatus.length > 0) {
					filtered = filtered.filter((e: any) => {
						const eventStatus = String(e.event_status ?? "").trim().toLowerCase();
						const numberOfTickets = e.number_of_tickets ?? 0;
						
						let actualStatus: string;
						
						if (eventStatus === "soldout" || eventStatus === "closed") {
							actualStatus = "sales_closed";
						} else if (eventStatus === "cancelled" || eventStatus === "postponed") {
							actualStatus = "not_confirmed";
						} else if (eventStatus === "notstarted" || eventStatus === "nosale") {
							actualStatus = numberOfTickets > 0 ? "on_sale" : "coming_soon";
						} else {
							actualStatus = numberOfTickets > 0 ? "on_sale" : "coming_soon";
						}
						
						return debouncedFilters.eventStatus.includes(actualStatus);
					});
				}

				// Sort events by date (earliest first)
				filtered.sort((a: any, b: any) => {
					const dateA = a.date_start ?? a.date_start_main_event ?? a.date_stop ?? "";
					const dateB = b.date_start ?? b.date_start_main_event ?? b.date_stop ?? "";
					if (!dateA && !dateB) return 0;
					if (!dateA) return 1;
					if (!dateB) return -1;
					return new Date(dateA).getTime() - new Date(dateB).getTime();
				});

				if (!isMounted) return;

				setAllEvents(filtered);
				setCurrentPage(1);
				setOptimisticEvents(null);
			} catch (err) {
				console.error("[EventsExplorer] Error loading events:", err);
				if (!isMounted) return;
				setAllEvents([]);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadEvents();

		return () => {
			isMounted = false;
		};
	}, [debouncedFilters, teamId, showAllEvents, fetchEvents]);

	// Optimistic update: show previous results while loading
	useEffect(() => {
		if (loading && allEvents.length > 0) {
			setOptimisticEvents(allEvents);
		}
	}, [loading, allEvents]);

	const handleFilterChange = useCallback((newFilters: any) => {
		updateFilters(newFilters);
		// Optimistic: keep current events visible while loading
		setOptimisticEvents(allEvents);
	}, [updateFilters, allEvents]);

	// Calculate pagination
	const totalEvents = allEvents.length;
	const totalPages = Math.ceil(totalEvents / eventsPerPage);
	const startIndex = showAll ? 0 : (currentPage - 1) * eventsPerPage;
	const endIndex = showAll ? totalEvents : startIndex + eventsPerPage;
	
	// Use optimistic events for display if available
	const displayEvents = optimisticEvents || allEvents;
	const displayedEvents = displayEvents.slice(startIndex, endIndex);
	const isOptimistic = optimisticEvents !== null && loading;

	// Reset to first page when showAll changes
	useEffect(() => {
		if (showAll) {
			setCurrentPage(1);
		}
	}, [showAll]);

	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

	return (
		<div className="relative">
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Filters Sidebar - Hidden on mobile, visible on desktop */}
				<aside className="hidden lg:block w-100 shrink-0">
					<EventsFilters 
						onFilterChange={handleFilterChange} 
						initialFilters={filters} 
						events={allEvents}
						hiddenFilters={hiddenFilters}
					/>
				</aside>

				{/* Events Grid */}
				<main className="flex-1 min-w-0">
					{loading && allEvents.length === 0 ? (
						<EventsListSkeleton count={6} />
					) : error ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-20 text-center">
								<p className="text-lg font-semibold text-foreground mb-2">Error loading events</p>
								<p className="text-sm text-muted-foreground mb-4">
									{error.message || "An error occurred while loading events. Please try again."}
								</p>
								<Button variant="outline" onClick={() => window.location.reload()}>
									Retry
								</Button>
							</CardContent>
						</Card>
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
									<Button variant="outline" onClick={clearFilters}>
										Clear all filters
									</Button>
									<Button variant="default" onClick={() => updateFilters({})}>
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
										{isOptimistic && (
											<span className="text-muted-foreground/70">Loading... </span>
										)}
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
							
							{/* Progressive loading: show skeleton while loading if we have no data */}
							{loading && displayedEvents.length === 0 ? (
								<EventsListSkeleton count={6} />
							) : (
								<VirtualEventsList
									events={displayedEvents}
									loading={loading && displayedEvents.length === 0}
									filters={filters}
									sportPath={sportPath}
								/>
							)}
							
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
				<DrawerContent className="max-h-[90vh] p-0 bg-card">
					<div className="overflow-y-auto">
						<EventsFilters 
							onFilterChange={handleFilterChange} 
							initialFilters={filters} 
							events={allEvents}
							isMobile={true}
							hiddenFilters={hiddenFilters}
						/>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}

