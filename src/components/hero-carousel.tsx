"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";
import { getCountryName } from "@/lib/country-flags";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { getHeroImage } from "@/lib/images";
import { EventImageWithFallback } from "@/components/event-image-with-fallback";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type FeaturedEvent = {
	id: string;
	name: string;
	date?: string;
	dateEnd?: string;
	countryCode?: string | null;
	city?: string;
	venue?: string;
	sportType?: string;
	tournamentId?: string;
	isOnSale?: boolean;
	event?: any; // Full event object for image column
};

/**
 * Hero Carousel Component
 * 
 * Auto-rotating carousel showcasing featured events with tabs for navigation.
 * Responsive design with "NOW ON SALE" badges and call-to-action buttons.
 */
export function HeroCarousel() {
	const [events, setEvents] = useState<FeaturedEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeIndex, setActiveIndex] = useState(0);
	const [api, setApi] = useState<CarouselApi>();
	const router = useRouter();
	const tabsScrollRef = useRef<HTMLDivElement>(null);
	const isDraggingRef = useRef(false);
	const startXRef = useRef(0);
	const scrollLeftRef = useRef(0);
	const hasDraggedRef = useRef(false);

	useEffect(() => {
		if (!api) return;

		api.on("select", () => {
			setActiveIndex(api.selectedScrollSnap());
		});
	}, [api]);

	// Mouse drag handlers for tab navigation on desktop
	useEffect(() => {
		// Wait for events to load before setting up drag
		if (events.length === 0) return;
		
		const tabsContainer = tabsScrollRef.current;
		if (!tabsContainer) return;

		let isDown = false;
		let startX = 0;
		let scrollLeft = 0;

		const handleMouseDown = (e: MouseEvent) => {
			// Only start drag on left mouse button
			if (e.button !== 0) return;
			
			isDown = true;
			isDraggingRef.current = true;
			hasDraggedRef.current = false;
			startX = e.pageX - tabsContainer.offsetLeft;
			scrollLeft = tabsContainer.scrollLeft;
			tabsContainer.style.cursor = "pointer";
			tabsContainer.style.userSelect = "none";
			
			// Don't prevent default here - let buttons handle clicks, we'll prevent on move
		};

		const handleMouseLeave = () => {
			if (isDown) {
				isDown = false;
				isDraggingRef.current = false;
				hasDraggedRef.current = false;
				tabsContainer.style.cursor = "pointer";
				tabsContainer.style.userSelect = "";
			}
		};

		const handleMouseUp = (e: MouseEvent) => {
			if (isDown) {
				isDown = false;
				isDraggingRef.current = false;
				tabsContainer.style.cursor = "pointer";
				tabsContainer.style.userSelect = "";
				
				// Reset drag flag after a short delay to allow click handlers to check
				setTimeout(() => {
					hasDraggedRef.current = false;
				}, 100);
			}
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDown) return;
			
			const x = e.pageX - tabsContainer.offsetLeft;
			const walk = (x - startX) * 2; // Scroll speed multiplier
			
			// Always scroll when dragging (even if movement is small)
			tabsContainer.scrollLeft = scrollLeft - walk;
			
			// Mark as dragged if movement is significant and prevent default
			if (Math.abs(walk) > 5) {
				hasDraggedRef.current = true;
				e.preventDefault();
				e.stopPropagation();
			}
		};

		// Add event listeners - use capture phase for mousedown to catch events before buttons
		tabsContainer.addEventListener("mousedown", handleMouseDown);
		tabsContainer.addEventListener("mouseleave", handleMouseLeave);
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("mousemove", handleMouseMove);

		// Set initial cursor
		tabsContainer.style.cursor = "pointer";

		return () => {
			tabsContainer.removeEventListener("mousedown", handleMouseDown);
			tabsContainer.removeEventListener("mouseleave", handleMouseLeave);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("mousemove", handleMouseMove);
		};
	}, [events.length]);

	useEffect(() => {
		const fetchFeaturedEvents = async () => {
			setLoading(true);
			try {
				// Fetch Formula 1 events (primary focus)
				const today = new Date().toISOString().split("T")[0];
				const responses = await Promise.all([
					fetch(`/api/xs2/events?sport_type=formula1&date_stop=ge:${today}&page_size=6&is_popular=true`),
					fetch(`/api/xs2/events?sport_type=formula1&date_stop=ge:${today}&page_size=6`),
				]);

				const allEvents: FeaturedEvent[] = [];
				
				for (const res of responses) {
					if (!res.ok) continue;
					const data = await res.json();
					const items = (data.events ?? data.results ?? data.items ?? []) as any[];
					
					for (const item of items) {
						const event: FeaturedEvent = {
							id: item.event_id ?? item.id,
							name: item.event_name ?? item.name ?? item.official_name ?? "Event",
							date: item.date_start ?? item.date_start_main_event,
							dateEnd: item.date_stop ?? item.date_stop_main_event,
							countryCode: item.iso_country ?? item.country,
							city: item.city,
							venue: item.venue_name ?? item.venue,
							sportType: item.sport_type,
							tournamentId: item.tournament_id,
							isOnSale: item.is_popular || (item.min_ticket_price_eur && item.min_ticket_price_eur > 0),
							event: item, // Store full event object for image column
						};
						
						// Avoid duplicates
						if (!allEvents.find(e => e.id === event.id)) {
							allEvents.push(event);
						}
					}
				}

				// Sort by date and take top 4-6
				const sorted = allEvents
					.filter(e => e.name && e.date)
					.sort((a, b) => {
						const dateA = new Date(a.date || 0).getTime();
						const dateB = new Date(b.date || 0).getTime();
						return dateA - dateB;
					})
					.slice(0, 6);

				setEvents(sorted);
			} catch (error) {
				console.error("[HeroCarousel] Error:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchFeaturedEvents();
	}, []);

	const formatEventDate = (startDate?: string, endDate?: string): string => {
		if (!startDate) return "";
		try {
			const start = new Date(startDate);
			const end = endDate ? new Date(endDate) : null;
			
			// Format day of week (3 letters) + day + month
			const formatDayMonth = (date: Date): string => {
				const dayOfWeek = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
				const day = date.getDate();
				const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
				return `${day} ${month}`;
			};
			
			// If no end date or same day, show single date
			if (!end || start.toDateString() === end.toDateString()) {
				const year = start.getFullYear();
				return `${formatDayMonth(start)}, ${year}`;
			}
			
			// Date range - same year
			const year = start.getFullYear();
			const startFormatted = formatDayMonth(start);
			const endFormatted = formatDayMonth(end);
			
			return `${startFormatted} - ${endFormatted}, ${year}`;
		} catch {
			return "";
		}
	};

	const getEventYear = (dateStr?: string): string => {
		if (!dateStr) return "2026";
		try {
			return new Date(dateStr).getFullYear().toString();
		} catch {
			return "2026";
		}
	};

	const formatSportType = (sportType?: string): string => {
		if (!sportType) return "Event";
		
		// Handle common sport types with proper formatting
		const sportMap: Record<string, string> = {
			formula1: "Formula 1",
			formula_1: "Formula 1",
			motogp: "MotoGP",
			moto_gp: "MotoGP",
			tennis: "Tennis",
			football: "Football",
			soccer: "Soccer",
		};
		
		const normalized = sportType.toLowerCase().replace("_", "");
		if (sportMap[normalized]) {
			return sportMap[normalized];
		}
		
		// Fallback: capitalize first letter of each word
		return sportType
			.replace(/_/g, " ")
			.replace(/\b\w/g, l => l.toUpperCase());
	};

	if (loading) {
		// Loading skeleton that matches the carousel structure
		return (
			<section className="relative overflow-hidden">
				<div className="relative h-[350px] sm:h-[420px] md:h-[450px] lg:h-[500px]">
					{/* Background Skeleton */}
					<div className="absolute inset-0 bg-muted animate-pulse" />
					<div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />

					{/* Content Skeleton */}
					<div className="relative mx-auto container px-4 h-full flex flex-col justify-end pb-16 sm:pb-20 md:pb-24">
						<div className="max-w-3xl w-full">
							{/* Badges Skeleton */}
							<div className="flex flex-wrap items-center gap-2 mb-3">
								<div className="h-6 w-20 bg-background/20 rounded animate-pulse" />
								<div className="h-6 w-16 bg-background/20 rounded-full animate-pulse" />
							</div>

							{/* Event Name Skeleton */}
							<div className="mb-4">
								<div className="h-8 sm:h-10 md:h-12 lg:h-14 w-3/4 bg-background/20 rounded animate-pulse mb-2" />
								<div className="h-8 sm:h-10 md:h-12 lg:h-14 w-1/2 bg-background/20 rounded animate-pulse" />
							</div>

							{/* Date and Location Skeleton */}
							<div className="flex flex-wrap items-center gap-2 mb-5">
								<div className="h-5 w-40 bg-background/20 rounded animate-pulse" />
								<div className="h-5 w-32 bg-background/20 rounded animate-pulse" />
							</div>

							{/* CTA Buttons Skeleton */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
								<div className="h-11 w-32 bg-background/20 rounded animate-pulse" />
								<div className="h-11 w-40 bg-background/20 rounded animate-pulse" />
							</div>
						</div>
					</div>
				</div>

				{/* Tab Navigation Skeleton */}
				<div className="absolute bottom-0 left-0 right-0 bg-foreground/40 backdrop-blur-sm border-t border-background/20">
					<div className="mx-auto container px-4 py-3 sm:py-4">
						<div className="flex items-center gap-3 overflow-x-auto">
							{[...Array(4)].map((_, i) => (
								<div
									key={i}
									className="h-8 w-24 sm:w-32 bg-background/20 rounded animate-pulse shrink-0"
								/>
							))}
						</div>
					</div>
				</div>
			</section>
		);
	}

	if (events.length === 0) {
		// Return null if no events (don't show anything)
		return null;
	}

	return (
		<section className="relative overflow-hidden">
			<Carousel
				opts={{
					align: "start",
					loop: true,
				}}
				plugins={[
					Autoplay({
						delay: 5000,
						stopOnInteraction: false,
					}),
				]}
				setApi={setApi}
				className="w-full"
			>
				<CarouselContent className="-ml-0">
					{events.map((event, index) => {
						const year = getEventYear(event.date);
						const eventUrl = event.tournamentId
							? `/events?tournament_id=${encodeURIComponent(event.tournamentId)}`
							: `/events/${event.id}`;

						return (
							<CarouselItem key={event.id} className="pl-0">
								<div className="relative h-[350px] sm:h-[420px] md:h-[450px] lg:h-[500px]">
									{/* Background Image */}
                                    <div className="absolute inset-0">
                                        <EventImageWithFallback
                                            eventId={event.id}
                                            sportType={event.sportType}
                                            event={event.event}
                                            alt={event.name}
                                            fill
                                            priority={index === 0}
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
                                    </div>

									{/* Content */}
									<div className="relative mx-auto container px-4 h-full flex flex-col justify-end pb-16 sm:pb-20 md:pb-24">
										<div className="max-w-3xl w-full">
											{/* Badges Row */}
											<div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
												{/* Sport Type Label */}
												<Badge variant="secondary" className="inline-block bg-secondary/90 text-primary-foreground text-[9px] sm:text-[10px] md:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded shadow-md">
													{formatSportType(event.sportType)}
												</Badge>
												{/* "NOW ON SALE" Badge */}
												{event.isOnSale && (
													<span className="inline-block bg-primary/10 backdrop-blur-sm text-primary border border-primary/20 text-[9px] sm:text-[10px] md:text-xs font-bold px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
														ON SALE
													</span>
												)}
											</div>

											{/* Event Name */}
											<div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4">
												
												<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-background leading-tight">
													{event.name}
												</h1>
											</div>

											{/* Date and Location Metadata */}
											{(event.date || event.city || event.countryCode) && (
												<div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4 md:mb-5 text-sm sm:text-base text-background/90">
													{event.date && (
														<span className="font-medium">{formatEventDate(event.date, event.dateEnd)}</span>
													)}
													{(event.city || event.countryCode) && (
														<>
															{event.date && <span className="text-background/60">|</span>}
															<CountryFlag countryCode={event.countryCode} size={40} className="shrink-0 w-6 h-6" />
															<span className="font-medium">
																{event.city && event.countryCode 
																	? `${event.city}, ${getCountryName(event.countryCode)}`
																	: event.city 
																		? event.city
																		: event.countryCode
																			? getCountryName(event.countryCode)
																			: ""}
															</span>
														</>
													)}
												</div>
											)}

											{/* CTA Buttons */}
											<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
												{/* Primary CTA */}
												<Button
													asChild
													size="lg"
													className="bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm md:text-base px-4 sm:px-5 md:px-7 h-10 sm:h-11 md:h-12 w-full sm:w-auto"
												>
													<Link href={eventUrl} className="flex items-center justify-center">
														Book Now
														<ArrowRight className="ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
													</Link>
												</Button>
												
												{/* Secondary CTA */}
												<Button
													asChild
													variant="outline"
													size="lg"
													className="bg-background/10 backdrop-blur-sm border-background/30 text-background hover:bg-background/20 hover:border-primary/50 transition-all duration-200 text-xs sm:text-sm md:text-base px-4 sm:px-5 md:px-7 h-10 sm:h-11 md:h-12 w-full sm:w-auto"
												>
													<Link href={`/events?sport_type=${event.sportType}`} className="flex items-center justify-center">
														View All {formatSportType(event.sportType)}
													</Link>
												</Button>
											</div>
										</div>
									</div>
								</div>
							</CarouselItem>
						);
					})}
				</CarouselContent>

				
			</Carousel>

			{/* Tab Navigation */}
			<div className="absolute bottom-0 left-0 right-0 bg-foreground/40 backdrop-blur-sm border-t border-background/20">
				<div className="mx-auto container px-4 py-3 sm:py-4">
					<div 
						ref={tabsScrollRef}
						className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
						style={{ cursor: 'pointer' }}
					>
						{events.map((event, index) => {
							const isActive = index === activeIndex;
							const formattedDate = formatEventDate(event.date, event.dateEnd);
							
							return (
								<button
									key={event.id}
									type="button"
						onMouseDown={(e: React.MouseEvent) => {
							// Trigger container drag handler - this ensures drag works when clicking buttons
							const container = tabsScrollRef.current;
							if (container && e.button === 0) {
								const syntheticEvent = new MouseEvent('mousedown', {
									bubbles: true,
									cancelable: true,
									button: 0,
									clientX: e.clientX,
									clientY: e.clientY,
								} as MouseEventInit);
								// Manually set pageX/pageY as they're not in MouseEventInit
								Object.defineProperty(syntheticEvent, 'pageX', { value: e.pageX, writable: false });
								Object.defineProperty(syntheticEvent, 'pageY', { value: e.pageY, writable: false });
								container.dispatchEvent(syntheticEvent);
							}
						}}
									onClick={(e) => {
										// Only navigate if we didn't drag
										if (!hasDraggedRef.current) {
											api?.scrollTo(index);
										}
										// Reset drag flag after click
										setTimeout(() => {
											hasDraggedRef.current = false;
										}, 0);
									}}
									className={cn(
										"relative px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 select-none",
										isActive
											? "text-background"
											: "text-background/60 hover:text-background/80"
									)}
									style={{ userSelect: 'none', cursor: 'pointer' }}
								>
									{event.name}
									{formattedDate && (
										<span className="ml-1.5 opacity-80">• {formattedDate}</span>
									)}
									{event.isOnSale && (
										<span className="ml-1.5 text-primary font-semibold">on sale!</span>
									)}
									{isActive && (
										<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
									)}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}

