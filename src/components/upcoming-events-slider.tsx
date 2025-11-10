"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { CountryFlag } from "@/components/country-flag";
import { SectionHeader } from "@/components/section-header";
import Autoplay from "embla-carousel-autoplay";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatDate(dateStr?: string): string {
	if (!dateStr) return "";
	try {
		const date = new Date(dateStr);
		const today = new Date();
		const diffTime = date.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Tomorrow";
		if (diffDays < 7) return `In ${diffDays} days`;
		
		return new Intl.DateTimeFormat(undefined, { 
			month: "short", 
			day: "numeric",
			year: "numeric"
		}).format(date);
	} catch {
		return dateStr;
	}
}

function formatDateRange(startDate?: string, endDate?: string): string {
	if (!startDate) return "";
	
	try {
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : null;
		
		// Format helper for single date: "22 May 2026"
		const formatSingleDate = (date: Date) => {
			return date.toLocaleDateString(undefined, { 
				day: "numeric",
				month: "short", 
				year: "numeric"
			});
		};
		
		// If no end date, show single date
		if (!end) {
			return formatSingleDate(start);
		}
		
		const startDay = start.toDateString();
		const endDay = end.toDateString();
		
		// If same day, show single date
		if (startDay === endDay) {
			return formatSingleDate(start);
		}
		
		// If same month and year, show range like "22 May - 24 May 2026"
		if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
			return `${start.getDate()} ${start.toLocaleDateString(undefined, { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
		}
		
		// If different months but same year, show range like "22 May - 5 Jun 2026"
		if (start.getFullYear() === end.getFullYear()) {
			return `${start.toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${end.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
		}
		
		// If different years, show full range like "22 May 2025 - 5 Jan 2026"
		return `${formatSingleDate(start)} - ${formatSingleDate(end)}`;
	} catch {
		return formatDate(startDate);
	}
}

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



export function UpcomingEventsSlider() {
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUpcoming = async () => {
			setLoading(true);
			const today = new Date().toISOString().split("T")[0];
			
			try {
				// Fetch optimized, pre-filtered list from API (smaller payload)
				const eventsRes = await fetch(`/api/xs2/events?date_stop=ge:${today}&page_size=16&event_status=notstarted&exclude_status=soldout,closed`);
				
				if (!eventsRes.ok) {
					console.error("[UpcomingEvents] API error:", eventsRes.status);
					setLoading(false);
					return;
				}
				
				const eventsData = await eventsRes.json();
				const events = (eventsData.events ?? eventsData.results ?? eventsData.items ?? []) as any[];
				
				const now = new Date();
				const sorted = events
					.filter((e: any) => {
						const startDate = new Date(e.date_start ?? e.date_start_main_event ?? 0);
						const isValidDate = startDate >= now && !isNaN(startDate.getTime());
						// Check ticket availability hints
						const numberOfTickets = Number(e.number_of_tickets ?? 0);
						const hasMinPrice = e.min_ticket_price_eur && Number(e.min_ticket_price_eur) > 0;
						const isPopular = e.is_popular === true;
						return isValidDate && (numberOfTickets > 0 || hasMinPrice || isPopular);
					})
					.sort((a: any, b: any) => {
						const aDate = new Date(a.date_start ?? a.date_start_main_event ?? 0);
						const bDate = new Date(b.date_start ?? b.date_start_main_event ?? 0);
						return aDate.getTime() - bDate.getTime();
					})
					.slice(0, 16);
				
				if (process.env.NODE_ENV === "development") {
					console.log("[UpcomingEvents] Found events:", {
						total: events.length,
						filtered: sorted.length,
						sample: sorted.slice(0, 3).map((e: any) => ({
							id: e.event_id ?? e.id,
							name: e.event_name ?? e.name,
							date: e.date_start,
							tickets: e.number_of_tickets,
							minPrice: e.min_ticket_price_eur,
						})),
					});
				}
				
				setEvents(sorted);
			} catch (error) {
				console.error("[UpcomingEvents] Error:", error);
				setEvents([]);
			} finally {
				setLoading(false);
			}
		};
		
		fetchUpcoming();
	}, []);

		if (loading) {
		return (
			<section className="py-12 bg-foreground">
				<div className="container mx-auto px-4">
					<SectionHeader
						title="Upcoming Events"
						subtitle="Don't miss out on these must-see events"
						variant="dark"
						className="mb-10"
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{[...Array(6)].map((_, i) => (
							<Card key={i} className="h-64 animate-pulse border shadow-md bg-background">
								<CardContent className="space-y-4">
									<div className="h-6 bg-muted rounded w-3/4" />
									<div className="h-4 bg-muted rounded w-1/2" />
									<div className="h-4 bg-muted rounded w-2/3" />
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>
		);
	}

	if (events.length === 0 && !loading) {
		return (
			<section className="py-12 bg-foreground">
				<div className="container mx-auto px-4">
					<SectionHeader
						title="Upcoming Events"
						subtitle="Check back soon for upcoming events"
						variant="dark"
						className="mb-10"
					/>
				</div>
			</section>
		);
	}

	return (
		<section className="py-16 bg-foreground">
			<div className="container mx-auto px-4">
				<SectionHeader
					title="Upcoming Events"
					subtitle="Don't miss out on these must-see events"
					variant="dark"
					className="mb-10"
				/>
				<Carousel
					opts={{
						align: "start",
						loop: false,
						dragFree: true,
					}}
					plugins={[
						Autoplay({
							delay: 4000,
							stopOnInteraction: false,
							stopOnMouseEnter: true,
						}),
					]}
					className="w-full"
				>
					<CarouselContent className="-ml-2 md:-ml-4">
						{events.map((e) => {
							const countryCode = e.iso_country ?? e.country;
							const sportType = e.sport_type ?? "";
							const startDate = e.date_start ?? e.date_start_main_event;
							const endDate = e.date_stop ?? e.date_stop_main_event;
							const fullDate = startDate ? new Date(startDate) : null;
							
							return (
								<CarouselItem key={e.event_id ?? e.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/4 pb-2">
									<Link href={`/events/${e.event_id ?? e.id}`} className="block h-full">
										<Card className="group h-full border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer bg-background hover:border-primary/20">
											<CardContent className="h-full flex flex-col justify-between">
												<div>
												{/* Header with sport badge and flag */}
												<div className="flex items-start justify-between mb-4">
													<Badge className="bg-secondary/90 text-primary-foreground shadow-sm rounded">
														{formatSportType(sportType)}
													</Badge>
													<CountryFlag countryCode={countryCode} size={32} className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8" />
												</div>

												{/* Event Name */}
												<h3 className="font-bold mb-4 line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
													{e.event_name ?? e.name ?? e.official_name ?? "Event"}
												</h3>
												</div>

												{/* Event Details */}
												<div className="h-full flex flex-col justify-end">
												<div className="space-y-3 mb-4">
													{startDate && (
														<div className="flex items-center gap-2 text-muted-foreground">
															<Calendar className="w-4 h-4 shrink-0" />
															<span className="text-sm flex-1">{formatDateRange(startDate, endDate)}</span>
															{fullDate && (
																<span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">
																	{fullDate.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
																</span>
															)}
														</div>
													)}
													{e.venue_name && (
														<div className="flex items-center gap-2 text-muted-foreground">
															<MapPin className="w-4 h-4 flex-shrink-0" />
															<span className="text-sm truncate">{e.venue_name ?? e.venue}</span>
														</div>
													)}
													{e.min_ticket_price_eur && (
														<div className="pt-2 border-t border-border">
															<div className="flex items-baseline gap-2">
																<span className="text-xs text-muted-foreground">From</span>
																<span className="font-bold text-foreground">€{(e.min_ticket_price_eur / 100).toFixed(0)}</span>
															</div>
														</div>
													)}
												</div>

												{/* CTA Button */}
												<Button className="w-full" variant="default" size="lg">
													View Tickets
													<svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
													</svg>
												</Button>
												</div>
											</CardContent>
										</Card>
									</Link>
								</CarouselItem>
							);
						})}
					</CarouselContent>
					<CarouselPrevious className="hidden md:flex -left-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background" />
					<CarouselNext className="hidden md:flex -right-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background" />
				</Carousel>
			</div>
		</section>
	);
}
