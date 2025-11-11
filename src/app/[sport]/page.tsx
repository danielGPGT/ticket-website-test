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
	params: { sport: string };
};

type SportRecord = {
	sport_id: string;
	image: string | null;
};

type TournamentRecord = {
	tournament_id: string;
	official_name: string | null;
	season: string | null;
	slug: string | null;
	image: string | null;
	date_start: string | null;
	date_stop: string | null;
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
	tournament_id: string | null;
	tournament_name: string | null;
};

export const revalidate = 900; // 15 minutes

function normalizeSportVariants(slug: string): string[] {
	const base = slug.toLowerCase();
	const variants = new Set<string>([base, base.replace(/-/g, ""), base.replace(/-/g, "_")]);
	return Array.from(variants);
}

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

async function fetchSportContext(sportSlug: string) {
	const supabase = getSupabaseAdmin();
	const variants = normalizeSportVariants(sportSlug);

	const { data: sport } = await supabase
		.from("sports")
		.select("sport_id,image")
		.in("sport_id", variants)
		.limit(1)
		.maybeSingle<SportRecord>();

	if (!sport) return null;

	const todayIso = new Date().toISOString();

	const [{ data: tournaments }, { data: events }, { data: venues }] = await Promise.all([
		supabase
			.from("tournaments")
			.select("tournament_id,official_name,season,slug,image,date_start,date_stop")
			.eq("sport_type", sport.sport_id)
			.order("date_start", { ascending: true })
			.limit(12) as any,
		supabase
			.from("events")
			.select(
				"event_id,event_name,slug,date_start,date_stop,venue_name,city,iso_country,min_ticket_price_eur,max_ticket_price_eur,tournament_id,tournament_name",
			)
			.eq("sport_type", sport.sport_id)
			.gte("date_start", todayIso)
			.order("date_start", { ascending: true })
			.limit(12) as any,
		supabase
			.from("events")
			.select("venue_id,venue_name,slug,city,iso_country")
			.eq("sport_type", sport.sport_id)
			.not("venue_id", "is", null)
			.order("venue_name", { ascending: true })
			.limit(12) as any,
	]);

	const uniqueVenues = new Map<string, { venue_id: string; venue_name: string | null; slug: string | null; city: string | null; iso_country: string | null }>();
	(venues ?? []).forEach((venue: any) => {
		if (!venue?.venue_id || uniqueVenues.has(venue.venue_id)) return;
		uniqueVenues.set(venue.venue_id, venue);
	});

	return {
		sport,
		tournaments: (tournaments ?? []) as TournamentRecord[],
		events: (events ?? []) as EventRecord[],
		venues: Array.from(uniqueVenues.values()),
	};
}

export async function generateStaticParams() {
	return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const sportSlug = params.sport.toLowerCase();
	const sportTitle = slugToTitle(sportSlug, "Sport");
	const description = `Discover upcoming ${sportTitle} tournaments, venues, and tickets. Browse verified inventory and hospitality for ${sportTitle} fans.`;

	return createPageMetadata({
		title: `${sportTitle} Tickets & Events | Apex Tickets`,
		description,
		path: buildSportPath(sportSlug),
		openGraph: {
			title: `${sportTitle} Tickets`,
			description,
		},
	});
}

export default async function SportPage({ params }: PageProps) {
	const sportSlug = params.sport.toLowerCase();
	const context = await fetchSportContext(sportSlug);

	if (!context) {
		notFound();
	}

	const { sport, tournaments, events, venues } = context;
	const sportTitle = slugToTitle(sportSlug, sportSlug);
	const breadcrumbs = createBreadcrumbList([
		{ name: "Sports", path: "/events" },
		{ name: sportTitle, path: buildSportPath(sportSlug) },
	]);

	const tournamentSlugMap = new Map<string, string>();
	tournaments.forEach((tournament) => {
		if (tournament.tournament_id && tournament.slug) {
			tournamentSlugMap.set(tournament.tournament_id, tournament.slug.toLowerCase());
		}
	});

	return (
		<div className="container mx-auto px-4 py-10 space-y-10">
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
			/>

			<SectionHeader
				title={`${sportTitle} Tickets & Experiences`}
				subtitle={`Real-time inventory, premium hospitality, and curated travel for every ${sportTitle} fixture.`}
			/>

			{/* Featured tournaments */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Signature tournaments</h2>
					{tournaments.length > 0 && (
						<Badge variant="outline" className="text-xs">
							{tournaments.length} listed
						</Badge>
					)}
				</div>
				{tournaments.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-sm text-muted-foreground text-center">
							No tournaments found yet—sync XS2 data to populate the ${sportTitle} calendar.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{tournaments.map((tournament) => {
							if (!tournament.slug) return null;
							const range = formatDateRange(tournament.date_start, tournament.date_stop);
							return (
								<Card
									key={tournament.tournament_id}
									className="group hover:border-primary/40 transition-all duration-200"
								>
									<CardHeader className="space-y-2">
										<CardTitle className="flex items-center justify-between text-base font-semibold">
											<span>{tournament.official_name ?? "Tournament"}</span>
											<ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
										</CardTitle>
										{tournament.season && (
											<Badge variant="secondary" className="w-fit">
												Season {tournament.season}
											</Badge>
										)}
									</CardHeader>
									<CardContent className="space-y-3 text-sm text-muted-foreground">
										{range && <p>{range}</p>}
										<Link
											href={buildTournamentPath(sportSlug, tournament.slug.toLowerCase())}
											className="text-primary font-medium hover:underline"
										>
											View tournament
										</Link>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			{/* Upcoming events */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Upcoming events</h2>
					{events.length > 0 && (
						<Badge variant="outline" className="text-xs">
							{events.length} ticketed
						</Badge>
					)}
				</div>
				{events.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-sm text-muted-foreground text-center">
							No upcoming fixtures are currently on sale. Check back soon for newly released inventory.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{events.map((event) => {
							const tournamentSlug = event.tournament_id
								? tournamentSlugMap.get(event.tournament_id)
								: null;
							const eventSlug = typeof event.slug === "string" ? event.slug.toLowerCase() : null;
							const minPrice = formatPrice(event.min_ticket_price_eur);
							const eventRange = formatDateRange(event.date_start, event.date_stop);
							const destination =
								tournamentSlug && eventSlug
									? buildEventPath(sportSlug, tournamentSlug, eventSlug)
									: `/events/${event.event_id}`;

							return (
								<Card
									key={event.event_id}
									className="flex flex-col justify-between hover:border-primary/40 transition-all duration-200"
								>
									<CardHeader className="space-y-3">
										<CardTitle className="text-base font-semibold leading-snug">
											<Link href={destination} className="hover:underline">
												{event.event_name ?? "Event"}
											</Link>
										</CardTitle>
										<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
											{eventRange && <span>{eventRange}</span>}
											{event.venue_name && <span>· {event.venue_name}</span>}
											{event.city && <span>· {event.city}</span>}
										</div>
									</CardHeader>
									<CardContent className="flex items-center justify-between text-sm">
										<div className="flex flex-col gap-1">
											<span className="text-muted-foreground">
												{event.tournament_name ?? "Tournament"}
											</span>
											{minPrice ? (
												<span className="font-semibold text-foreground">{minPrice}+</span>
											) : (
												<span className="text-muted-foreground">Pricing on request</span>
											)}
										</div>
										<Link href={destination} className="text-primary font-medium hover:underline">
											See tickets
										</Link>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			{/* Popular venues */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Featured venues</h2>
					{venues.length > 0 && (
						<Badge variant="outline" className="text-xs">
							{venues.length} profiled
						</Badge>
					)}
				</div>
				{venues.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-sm text-muted-foreground text-center">
							Track XS2 venue associations to unlock venue guides for {sportTitle}.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-3">
						{venues.map((venue) => (
							<Card key={venue.venue_id} className="group hover:border-primary/40 transition-all duration-200">
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


