"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight } from "lucide-react";
import { getHeroImage } from "@/lib/images";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type FeaturedEvent = {
	id: string;
	name: string;
	date?: string;
	countryCode?: string | null;
	sportType?: string;
	tournamentId?: string;
	isOnSale?: boolean;
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

	useEffect(() => {
		if (!api) return;

		api.on("select", () => {
			setActiveIndex(api.selectedScrollSnap());
		});
	}, [api]);

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
							countryCode: item.iso_country ?? item.country,
							sportType: item.sport_type,
							tournamentId: item.tournament_id,
							isOnSale: item.is_popular || (item.min_ticket_price_eur && item.min_ticket_price_eur > 0),
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

	const formatEventDate = (dateStr?: string): string => {
		if (!dateStr) return "";
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString(undefined, { 
				year: "numeric",
				month: "long",
			});
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

	if (loading || events.length === 0) {
		// Fallback to static hero if no events
		return (
			<section className="relative overflow-hidden h-[400px] sm:h-[450px] lg:h-[500px]">
				<div className="absolute inset-0">
					<Image
						src={getHeroImage("sports")}
						alt="Sports hero background"
						fill
						priority
						className="object-cover"
						sizes="100vw"
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
				</div>
				<div className="relative mx-auto container px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
					<div className="flex flex-col items-center text-center gap-6 sm:gap-8 max-w-3xl mx-auto">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
							Your seat to elite sports
						</h1>
						<p className="text-base sm:text-lg text-white/90 max-w-2xl">
							F1, Football, MotoGP, Tennis and more — verified tickets via XS2. Secure your spot at the world's biggest events.
						</p>
					</div>
				</div>
			</section>
		);
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
										<Image
											src={getHeroImage("sports")}
											alt={event.name}
											fill
											priority={index === 0}
											className="object-cover"
											sizes="100vw"
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
												<CountryFlag countryCode={event.countryCode} size={40} className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
												<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-background leading-tight">
													{event.name} {year}
												</h1>
											</div>

											{/* Year and CTA Buttons */}
											<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
												{/* Primary CTA */}
												<Button
													asChild
													size="lg"
													className="bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm md:text-base px-4 sm:px-5 md:px-7 h-10 sm:h-11 md:h-12 w-full sm:w-auto"
												>
													<Link href={eventUrl} className="flex items-center justify-center">
														{year} Book Now
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
					<div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
						{events.map((event, index) => {
							const isActive = index === activeIndex;
							const year = getEventYear(event.date);
							
							return (
								<button
									key={event.id}
									onClick={() => api?.scrollTo(index)}
									className={cn(
										"relative px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0",
										isActive
											? "text-background"
											: "text-background/60 hover:text-background/80"
									)}
								>
									{event.name} {year}
									{event.isOnSale && (
										<span className="ml-1 text-primary font-semibold">on sale!</span>
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

