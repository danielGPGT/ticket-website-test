"use client";
import { useEffect, useState } from "react";
import { EventCardHero } from "@/components/event-card-hero";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { resolveEventHref } from "@/lib/seo";

export function PopularEventsSection() {
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Fetch popular events across multiple sports
		const fetchPopular = async () => {
			setLoading(true);
			const sports = ["formula1", "football", "motogp", "tennis"];
			const today = new Date().toISOString().split("T")[0];
			
			try {
				const promises = sports.map(sport => 
					fetch(`/api/xs2/events?sport_type=${sport}&date_stop=ge:${today}&page_size=3&is_popular=true`)
						.then(r => r.json())
						.then(d => (d.events ?? d.results ?? d.items ?? []))
						.catch(() => [])
				);
				
				const results = await Promise.all(promises);
				const all = results.flat();
				
				let enriched = all;
				const tournamentIds = Array.from(new Set(all.map((event: any) => event.tournament_id ?? event.tournamentId).filter(Boolean))) as string[];

				if (tournamentIds.length > 0) {
					try {
						const tournamentsRes = await fetch(`/api/xs2/tournaments?tournament_ids=${encodeURIComponent(tournamentIds.join(","))}&page_size=${tournamentIds.length}`);
						if (tournamentsRes.ok) {
							const tournamentsData = await tournamentsRes.json();
							const tournaments = (tournamentsData.tournaments ?? tournamentsData.results ?? []) as any[];
							const map = new Map<string, any>();
							tournaments.forEach((t) => {
								if (t?.tournament_id) {
									map.set(t.tournament_id, t);
								}
							});

							enriched = all.map((event: any) => {
								const tournament = map.get(event.tournament_id ?? event.tournamentId);
								return {
									...event,
									tournament,
									tournament_slug: tournament?.slug ?? event.tournament_slug ?? null,
								};
							});
						}
					} catch (err) {
						console.error("[PopularEvents] Error enriching tournaments:", err);
					}
				}

				// Sort by popularity/date and take top 6
				const sorted = enriched
					.filter((e: any) => e.is_popular || e.min_ticket_price_eur > 0)
					.sort((a: any, b: any) => {
						const aDate = new Date(a.date_start ?? a.date_start_main_event ?? 0);
						const bDate = new Date(b.date_start ?? b.date_start_main_event ?? 0);
						return aDate.getTime() - bDate.getTime();
					})
					.slice(0, 6);
				
				setEvents(sorted);
			} catch (error) {
				console.error("[PopularEvents] Error:", error);
			} finally {
				setLoading(false);
			}
		};
		
		fetchPopular();
	}, []);

	if (loading) {
		return (
			<section className="py-12">
				<div className="container mx-auto px-4">
					<SectionHeader 
						title="Popular Events" 
						subtitle="Featured events from around the world"
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[...Array(6)].map((_, i) => (
							<Card key={i} className="h-64 animate-pulse">
								<CardContent className="h-full bg-muted" />
							</Card>
						))}
					</div>
				</div>
			</section>
		);
	}

	if (events.length === 0) {
		return null;
	}

	return (
		<section className="py-12 bg-muted/30">
			<div className="container mx-auto px-4">
				<SectionHeader
					title="Popular Events"
					subtitle="Featured events from around the world"
					action={{ label: "View All", href: "/events" }}
				/>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{events.map((e) => {
						const href = resolveEventHref(
							{
								id: String(e.event_id ?? e.id ?? ""),
								event_id: e.event_id ?? e.id ?? "",
								slug: e.slug ?? e.event_slug ?? null,
								event: e,
								sport_type: e.sport_type ?? e.sportType ?? null,
								sportType: e.sport_type ?? e.sportType ?? null,
								tournament_id: e.tournament_id ?? e.tournamentId ?? null,
								tournamentId: e.tournament_id ?? e.tournamentId ?? null,
							},
							{
								sportType: e.sport_type ?? e.sportType ?? null,
								tournamentSlug: (e as any)?.tournament_slug ?? null,
							},
						);

						return (
							<EventCardHero
								key={e.event_id ?? e.id}
								id={String(e.event_id ?? e.id)}
								name={e.event_name ?? e.name ?? e.official_name ?? "Event"}
								date={e.date_start ?? e.date_start_main_event ?? undefined}
								venue={e.venue_name ?? e.venue ?? undefined}
								countryCode={e.iso_country ?? e.country ?? null}
								sportType={e.sport_type ?? undefined}
								minPrice={e.min_ticket_price_eur ? e.min_ticket_price_eur / 100 : undefined}
								imageUrl={e.image_url ?? e.image ?? undefined}
								href={href}
							/>
						);
					})}
				</div>
			</div>
		</section>
	);
}

