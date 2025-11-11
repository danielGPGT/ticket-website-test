import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	createPageMetadata,
	createBreadcrumbList,
	buildSportPath,
	buildTournamentPath,
	buildEventPath,
	buildVenuePath,
	slugToTitle,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";

type PageProps = {
	params: { sport: string; tournament: string };
};

type TournamentRecord = {
	tournament_id: string;
	official_name: string | null;
	season: string | null;
	image: string | null;
	date_start: string | null;
	date_stop: string | null;
	slug: string | null;
	venue_count?: number | null;
};

type EventRecord = {
	event_id: string;
	event_name: string | null;
	slug: string | null;
	date_start: string | null;
	date_stop: string | null;
	venue_name: string | null;
	city: string | null;
	iso_country: string | null;
	min_ticket_price_eur: number | null;
	max_ticket_price_eur: number | null;
};

export const revalidate = 900; // 15 minutes

function formatDateRange(start?: string | null, end?: string | null) {
	if (!start) return null;
	try {
		const startDate = new Date(start);
		const endDate = end ? new Date(end) : null;
		const formatter = new Intl.DateTimeFormat(undefined, {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
		if (!endDate || startDate.toDateString() === endDate.toDateString()) {
			return formatter.format(startDate);
		}
		return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
	} catch {
		return start;
	}
}

function formatPrice(eur?: number | null) {
	if (!eur || eur <= 0) return null;
	const value = eur > 1000 ? eur / 100 : eur;
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	}).format(value);
}

async function fetchTournamentContext(sportSlug: string, tournamentSlug: string) {
	const supabase = getSupabaseAdmin();
	const { data: tournament } = await supabase
		.from("tournaments")
		.select("tournament_id,official_name,season,image,date_start,date_stop,slug")
		.eq("slug", tournamentSlug)
		.eq("sport_type", sportSlug)
		.limit(1)
		.maybeSingle<TournamentRecord>();

	if (!tournament) return null;

	const todayIso = new Date().toISOString();

	const [{ data: events }, { data: venues }] = await Promise.all([
		supabase
			.from("events")
			.select(
				"event_id,event_name,slug,date_start,date_stop,venue_name,city,iso_country,min_ticket_price_eur,max_ticket_price_eur",
			)
			.eq("tournament_id", tournament.tournament_id)
			.gte("date_start", todayIso)
			.order("date_start", { ascending: true })
			.limit(24) as any,
		supabase
			.from("events")
			.select("venue_id,venue_name,slug,city,iso_country")
			.eq("tournament_id", tournament.tournament_id)
			.not("venue_id", "is", null)
			.limit(24) as any,
	]);

	const uniqueVenues = new Map<string, { venue_id: string; venue_name: string | null; slug: string | null; city: string | null; iso_country: string | null }>();
	(venues ?? []).forEach((venue: any) => {
		if (!venue?.venue_id || uniqueVenues.has(venue.venue_id)) return;
		uniqueVenues.set(venue.venue_id, venue);
	});

	return {
		tournament,
		events: (events ?? []) as EventRecord[],
		venues: Array.from(uniqueVenues.values()),
	};
}

export async function generateStaticParams() {
	return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const sportSlug = params.sport.toLowerCase();
	const tournamentSlug = params.tournament.toLowerCase();

	const sportTitle = slugToTitle(sportSlug, "Sport");
	const tournamentTitle = slugToTitle(tournamentSlug, "Tournament");
	const description = `Stay on top of ${tournamentTitle} fixtures, venues, and ticket availability for ${sportTitle} fans.`;

	return createPageMetadata({
		title: `${tournamentTitle} Tickets & Schedule | ${sportTitle}`,
		description,
		path: buildTournamentPath(sportSlug, tournamentSlug),
		openGraph: {
			title: `${tournamentTitle} Tickets`,
			description,
		},
	});
}

export default async function TournamentPage({ params }: PageProps) {
	const sportSlug = params.sport.toLowerCase();
	const tournamentSlug = params.tournament.toLowerCase();

	const context = await fetchTournamentContext(sportSlug, tournamentSlug);
	if (!context) {
		notFound();
	}

	const { tournament, events, venues } = context;
	const sportTitle = slugToTitle(sportSlug, sportSlug);
	const tournamentTitle = tournament.official_name ?? slugToTitle(tournamentSlug, tournamentSlug);
	const breadcrumbs = createBreadcrumbList([
		{ name: "Sports", path: "/events" },
		{ name: sportTitle, path: buildSportPath(sportSlug) },
		{ name: tournamentTitle, path: buildTournamentPath(sportSlug, tournamentSlug) },
	]);

	return (
		<div className="container mx-auto px-4 py-10 space-y-10">
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
			/>

			<SectionHeader
				title={`${tournamentTitle} Tickets & Fixtures`}
				subtitle={`Hospitality, grandstands, and travel for every ${tournamentTitle} session on the ${sportTitle} calendar.`}
			/>

			<Card>
				<CardHeader className="space-y-2">
					<CardTitle className="text-lg font-semibold">Tournament overview</CardTitle>
					<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
						{tournament.season && <Badge variant="secondary">Season {tournament.season}</Badge>}
						{formatDateRange(tournament.date_start, tournament.date_stop) && (
							<span>{formatDateRange(tournament.date_start, tournament.date_stop)}</span>
						)}
					</div>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground space-y-3">
					<p>
						Track every session, hospitality drop, and venue update as we syndicate XS2 inventory in near real-time.
						Bookmark this page to monitor pricing, availability, and schedule adjustments.
					</p>
					<p className="text-foreground font-medium">
						{events.length} on-sale events · {venues.length} associated venues
					</p>
				</CardContent>
			</Card>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Bookable sessions</h2>
					{events.length > 0 && (
						<Badge variant="outline" className="text-xs">
							{events.length} available
						</Badge>
					)}
				</div>
				{events.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-sm text-muted-foreground text-center">
							Schedule is confirmed but tickets are not yet on sale. Follow XS2 updates or set availability alerts.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{events.map((event) => {
							const eventSlug = typeof event.slug === "string" ? event.slug.toLowerCase() : null;
							const destination = eventSlug
								? buildEventPath(sportSlug, tournamentSlug, eventSlug)
								: `/events/${event.event_id}`;
							const minPrice = formatPrice(event.min_ticket_price_eur);

							return (
								<Card key={event.event_id} className="flex flex-col justify-between">
									<CardHeader className="space-y-2">
										<CardTitle className="text-base font-semibold">
											<Link href={destination} className="hover:underline">
												{event.event_name ?? "Event"}
											</Link>
										</CardTitle>
										{formatDateRange(event.date_start, event.date_stop) && (
											<span className="text-sm text-muted-foreground">
												{formatDateRange(event.date_start, event.date_stop)}
											</span>
										)}
										<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
											{event.venue_name && <Badge variant="secondary">{event.venue_name}</Badge>}
											{event.city && <Badge variant="secondary">{event.city}</Badge>}
											{event.iso_country && <Badge variant="secondary">{event.iso_country}</Badge>}
										</div>
									</CardHeader>
									<CardContent className="flex items-center justify-between text-sm">
										<div className="flex flex-col gap-1">
											{minPrice ? (
												<span className="font-semibold text-foreground">From {minPrice}</span>
											) : (
												<span className="text-muted-foreground">Pricing on request</span>
											)}
										</div>
										<Link href={destination} className="text-primary font-medium hover:underline">
											View tickets
										</Link>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Venues on the circuit</h2>
					{venues.length > 0 && (
						<Badge variant="outline" className="text-xs">
							{venues.length} connected
						</Badge>
					)}
				</div>
				{venues.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-sm text-muted-foreground text-center">
							XS2 venues will appear here once events are paired with confirmed stadiums or circuits.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-3">
						{venues.map((venue) => (
							<Card key={venue.venue_id} className="group">
								<CardHeader className="space-y-2">
									<CardTitle className="text-base font-semibold leading-snug">
										<Link
											href={buildVenuePath(venue.slug ?? venue.venue_id)}
											className="hover:underline"
										>
											{venue.venue_name ?? "Venue"}
										</Link>
									</CardTitle>
									{venue.city && (
										<span className="text-sm text-muted-foreground">
											{venue.city}
											{venue.iso_country ? `, ${venue.iso_country}` : ""}
										</span>
									)}
								</CardHeader>
								<CardContent>
									<Link
										href={buildVenuePath(venue.slug ?? venue.venue_id)}
										className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
									>
										View venue
										<ArrowUpRight className="w-4 h-4" />
									</Link>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}


