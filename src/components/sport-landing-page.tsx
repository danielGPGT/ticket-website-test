"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/section-header";
import { EventCardHorizontal } from "@/components/event-card-horizontal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { normalizeToIso3 } from "@/lib/country-flags";

type SportLandingPageProps = {
	sportType: string;
	sportName: string;
	description: string;
	metaDescription: string;
	upcomingEventsCount?: number;
	popularTournaments?: Array<{ id: string; name: string; season?: string }>;
};

export function SportLandingPage({
	sportType,
	sportName,
	description,
	metaDescription,
	upcomingEventsCount = 12,
	popularTournaments = [],
}: SportLandingPageProps) {
	const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [tournaments, setTournaments] = useState<any[]>([]);

	useEffect(() => {
		// Fetch upcoming events for this sport
		const fetchEvents = async () => {
			setLoading(true);
			try {
				const today = new Date().toISOString().split("T")[0];
				const res = await fetch(
					`/api/xs2/events?sport_type=${encodeURIComponent(sportType)}&date_stop=ge:${today}&page_size=${upcomingEventsCount}&origin=allevents`
				);
				const data = await res.json();
				const events = data.events ?? data.results ?? data.items ?? [];
				
				// Sort by date
				events.sort((a: any, b: any) => {
					const dateA = a.date_start ?? a.date_start_main_event ?? "";
					const dateB = b.date_start ?? b.date_start_main_event ?? "";
					return new Date(dateA).getTime() - new Date(dateB).getTime();
				});
				
				setUpcomingEvents(events.slice(0, upcomingEventsCount));
			} catch (error) {
				if (process.env.NODE_ENV === "development") {
					console.error("[SportLandingPage] Error fetching events:", error);
				}
			} finally {
				setLoading(false);
			}
		};

		// Fetch popular tournaments
		const fetchTournaments = async () => {
			try {
				const res = await fetch(
					`/api/xs2/tournaments?sport_type=${encodeURIComponent(sportType)}&page_size=10`
				);
				const data = await res.json();
				const tournamentsData = data.tournaments ?? data.results ?? data.items ?? [];
				
				// Sort by relevance (current season first)
				const currentYear = new Date().getFullYear();
				tournamentsData.sort((a: any, b: any) => {
					const aSeason = parseInt(a.season || currentYear);
					const bSeason = parseInt(b.season || currentYear);
					if (aSeason === currentYear && bSeason !== currentYear) return -1;
					if (bSeason === currentYear && aSeason !== currentYear) return 1;
					return bSeason - aSeason;
				});
				
				setTournaments(tournamentsData.slice(0, 6));
			} catch (error) {
				if (process.env.NODE_ENV === "development") {
					console.error("[SportLandingPage] Error fetching tournaments:", error);
				}
			}
		};

		fetchEvents();
		fetchTournaments();
	}, [sportType, upcomingEventsCount]);

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 lg:py-24">
				<div className="container mx-auto px-4">
					<div className="max-w-3xl">
						<Badge className="mb-4" variant="secondary">
							Official Tickets
						</Badge>
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
							{sportName} Tickets
						</h1>
						<p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
							{description}
						</p>
						<div className="flex flex-wrap gap-3">
							<Button asChild size="lg" className="text-base">
								<Link href={`/events?sport_type=${encodeURIComponent(sportType)}`}>
									View All Events
									<ArrowRight className="ml-2 w-5 h-5" />
								</Link>
							</Button>
							<Button asChild variant="outline" size="lg" className="text-base">
								<Link href="/events?origin=allevents">
									Browse All Sports
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Popular Tournaments */}
			{tournaments.length > 0 && (
				<section className="py-12 lg:py-16 bg-muted/30">
					<div className="container mx-auto px-4">
						<SectionHeader
							title="Popular Tournaments"
							subtitle={`Top ${sportName} competitions and events`}
							className="mb-8"
						/>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{tournaments.map((tournament) => (
								<Card key={tournament.id ?? tournament.tournament_id} className="hover:shadow-lg transition-shadow">
									<CardContent className="p-6">
										<div className="flex items-start justify-between mb-4">
											<Trophy className="w-6 h-6 text-primary" />
											{tournament.season && (
												<Badge variant="secondary" className="text-xs">
													{tournament.season}
												</Badge>
											)}
										</div>
										<h3 className="font-semibold text-lg mb-2">
											{tournament.name ?? tournament.tournament_name ?? "Tournament"}
										</h3>
										<Button
											asChild
											variant="ghost"
											size="sm"
											className="mt-2"
										>
											<Link href={`/events?tournament_id=${encodeURIComponent(tournament.id ?? tournament.tournament_id)}`}>
												View Events
												<ArrowRight className="ml-2 w-4 h-4" />
											</Link>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Upcoming Events */}
			<section className="py-12 lg:py-16">
				<div className="container mx-auto px-4">
					<SectionHeader
						title="Upcoming Events"
						subtitle={`Browse ${sportName.toLowerCase()} events and secure your tickets`}
						className="mb-8"
					/>
					{loading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : upcomingEvents.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-20 text-center">
								<p className="text-lg font-semibold text-foreground mb-2">No upcoming events</p>
								<p className="text-sm text-muted-foreground mb-4">
									Check back soon for new {sportName.toLowerCase()} events.
								</p>
								<Button asChild variant="outline">
									<Link href="/events">Browse All Events</Link>
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{upcomingEvents.map((event) => {
								const countryCode = event.iso_country ?? event.country ?? event.venue_country ?? event.location?.country ?? event.location?.iso_country ?? null;
								const timeStart = event.date_start_main_event ?? event.date_start;
								const timeEnd = event.date_stop_main_event ?? event.date_stop;
								
								return (
									<EventCardHorizontal
										key={event.id ?? event.event_id}
										id={String(event.id ?? event.event_id)}
										name={event.event_name ?? event.name ?? event.official_name ?? "Event"}
										date={event.date_start ?? event.date_start_main_event}
										dateEnd={event.date_stop ?? event.date_stop_main_event}
										timeStart={timeStart}
										timeEnd={timeEnd}
										venue={event.venue_name ?? event.venue}
										countryCode={countryCode}
										sportType={event.sport_type}
										tournamentName={event.tournament_name}
										city={event.city}
										minPrice={event.min_ticket_price_eur}
										maxPrice={event.max_ticket_price_eur}
										status={event.event_status as any}
										numberOfTickets={event.number_of_tickets}
										currency="£"
									/>
								);
							})}
						</div>
					)}
					{!loading && upcomingEvents.length > 0 && (
						<div className="mt-8 text-center">
							<Button asChild size="lg" variant="outline">
								<Link href={`/events?sport_type=${encodeURIComponent(sportType)}`}>
									View All {sportName} Events
									<ArrowRight className="ml-2 w-5 h-5" />
								</Link>
							</Button>
						</div>
					)}
				</div>
			</section>

			{/* Trust Section */}
			<section className="py-12 lg:py-16 bg-muted/30">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center">
						<h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
							Why Choose Apex Tickets for {sportName} Tickets?
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
							<div>
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
									<Calendar className="w-6 h-6 text-primary" />
								</div>
								<h3 className="font-semibold mb-2">Official Tickets</h3>
								<p className="text-sm text-muted-foreground">
									All tickets are verified and official from authorized sellers
								</p>
							</div>
							<div>
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
									<MapPin className="w-6 h-6 text-primary" />
								</div>
								<h3 className="font-semibold mb-2">Secure Booking</h3>
								<p className="text-sm text-muted-foreground">
									Safe and secure payment processing with buyer protection
								</p>
							</div>
							<div>
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
									<Trophy className="w-6 h-6 text-primary" />
								</div>
								<h3 className="font-semibold mb-2">Best Prices</h3>
								<p className="text-sm text-muted-foreground">
									Competitive prices with no hidden fees or charges
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

