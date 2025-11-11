import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	createPageMetadata,
	createBreadcrumbList,
	buildCityPath,
	buildGeoCityRoute,
	buildGeoCountryRoute,
	buildVenuePath,
	buildEventPath,
	slugToTitle,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSportPath } from "@/lib/sport-routes";

type PageProps = {
	params: { country: string; city: string };
};

type CityContext = {
	countryName: string;
	cityName: string;
	venues: Array<{ slug: string | null; official_name: string | null }>;
	events: Array<{
		event_id: string | null;
		event_name: string | null;
		slug: string | null;
		date_start: string | null;
		date_stop: string | null;
		venue_name: string | null;
		sport_type: string | null;
		tournament_id: string | null;
		tournament_name: string | null;
		tournament_slug: string | null;
		min_ticket_price_eur: number | null;
	}>;
};

export const revalidate = 3600; // 1 hour

type CityRow = {
	city: string | null;
	country: string | null;
};

type VenueRow = {
	slug: string | null;
	official_name: string | null;
};

type EventRow = {
	event_id?: string | null;
	id?: string | null;
	slug?: string | null;
	event_slug?: string | null;
	event_name?: string | null;
	name?: string | null;
	date_start?: string | null;
	date_stop?: string | null;
	date_start_main_event?: string | null;
	date_stop_main_event?: string | null;
	venue_name?: string | null;
	sport_type?: string | null;
	tournament_id?: string | null;
	tournamentId?: string | null;
	tournament_name?: string | null;
	min_ticket_price_eur?: number | null;
	iso_country?: string | null;
	country?: string | null;
	tournament_slug?: string | null;
	tournament?: { slug?: string | null } | null;
};

function slugToPattern(slug: string): string {
	return `%${slug.replace(/-/g, "%")}%`;
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

async function fetchCityContext(countrySlug: string, citySlug: string): Promise<CityContext | null> {
	const supabase = getSupabaseAdmin();
	const countryPattern = slugToPattern(countrySlug);
	const cityPattern = slugToPattern(citySlug);

	const { data: cityRecordData, error } = await supabase
		.from("cities")
		.select("city,country")
		.ilike("country", countryPattern)
		.ilike("city", cityPattern)
		.limit(1)
		.single();

	const cityRecord = (cityRecordData as CityRow | null) ?? null;

	if (error || !cityRecord) {
		return null;
	}

	const { data: venuesData } = await supabase
		.from("venues")
		.select("slug,official_name")
		.ilike("country", slugToPattern(cityRecord.country ?? countrySlug))
		.ilike("city", slugToPattern(cityRecord.city ?? citySlug))
		.limit(12);

	const venues = (venuesData as VenueRow[] | null) ?? [];

	const todayIso = new Date().toISOString();
	const { data: eventsData } = await supabase
		.from("events")
		.select(
			"event_id,event_name,slug,date_start,date_stop,venue_name,sport_type,tournament_id,tournament_name,min_ticket_price_eur",
		)
		.ilike("city", slugToPattern(cityRecord.city ?? citySlug))
		.gte("date_start", todayIso)
		.order("date_start", { ascending: true })
		.limit(20);

	const events = (eventsData as EventRow[] | null) ?? [];

	const tournamentIds = Array.from(
		new Set(
			events
				.map((event) => event.tournament_id ?? event.tournamentId ?? null)
				.filter((id): id is string => Boolean(id)),
		),
	);

	const { data: tournamentSlugs } = tournamentIds.length
		? await supabase
				.from("tournaments")
				.select("tournament_id,slug")
				.in("tournament_id", tournamentIds)
				.returns<Array<{ tournament_id: string | null; slug: string | null }>>()
		: { data: [] as Array<{ tournament_id: string | null; slug: string | null }> };

	const slugByTournamentId = new Map<string, string>();
	(tournamentSlugs ?? []).forEach((row) => {
		if (row.tournament_id && row.slug) {
			slugByTournamentId.set(row.tournament_id, row.slug.toLowerCase());
		}
	});

	return {
		countryName: cityRecord.country ?? slugToTitle(countrySlug, countrySlug),
		cityName: cityRecord.city ?? slugToTitle(citySlug, citySlug),
		venues: venues ?? [],
		events: events.map((event) => ({
			event_id: event.event_id ?? event.id ?? null,
			event_name: event.event_name ?? event.name ?? null,
			slug: event.slug ?? event.event_slug ?? null,
			date_start: event.date_start ?? null,
			date_stop: event.date_stop ?? null,
			venue_name: event.venue_name ?? null,
			sport_type: event.sport_type ?? null,
			tournament_id: event.tournament_id ?? null,
			tournament_name: event.tournament_name ?? null,
			tournament_slug: event.tournament_id ? slugByTournamentId.get(event.tournament_id) ?? null : null,
			min_ticket_price_eur: event.min_ticket_price_eur ?? null,
		})),
	};
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const countrySlug = params.country.toLowerCase();
	const citySlug = params.city.toLowerCase();

	const context = await fetchCityContext(countrySlug, citySlug);

	if (!context) {
		return createPageMetadata({
			title: "City Not Found | Apex Tickets",
			description: "Explore our global events to find the city you're looking for.",
			path: buildCityPath(countrySlug, citySlug),
		});
	}

	const { countryName, cityName } = context;
	const description = `Plan your sports experience in ${cityName}, ${countryName}. Explore venues, upcoming events, and travel tips for fans.`;

	return createPageMetadata({
		title: `${cityName} Sports Tickets & Venues | ${countryName}`,
		description,
		path: buildCityPath(countrySlug, citySlug),
		openGraph: {
			title: `${cityName} Sports & Tickets`,
			description,
		},
	});
}

export default async function CityPage({ params }: PageProps) {
	const countrySlug = params.country.toLowerCase();
	const citySlug = params.city.toLowerCase();

	const context = await fetchCityContext(countrySlug, citySlug);
	if (!context) {
		notFound();
	}

	const { countryName, cityName, venues, events } = context;

	const breadcrumbs = createBreadcrumbList([
		{ name: countryName, path: buildGeoCountryRoute(countrySlug) },
		{ name: cityName, path: buildGeoCityRoute(countrySlug, citySlug) },
	]);

	return (
		<div className="container mx-auto px-4 py-10 space-y-8">
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
			/>

			<SectionHeader
				title={`${cityName} Sports Tickets`}
				subtitle={`Top venues, upcoming events, and hospitality options across ${cityName}, ${countryName}.`}
			/>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Upcoming events</h2>
					{events.length > 0 && (
						<Badge variant="outline" className="text-xs">
							{events.length} on sale
						</Badge>
					)}
				</div>
				{events.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-sm text-muted-foreground text-center">
							No ticketed events in {cityName} are live right now. Check back soon or browse all global fixtures.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{events.map((event) => {
							const sportPath = event.sport_type ? getSportPath(event.sport_type) : null;
							const sportSlug = sportPath ? sportPath.replace(/^\//, "") : null;
							const tournamentSlug =
								event.tournament_slug ??
								(typeof event.tournament_name === "string"
									? event.tournament_name.toLowerCase().replace(/\s+/g, "-")
									: null);
							const eventSlug = typeof event.slug === "string" ? event.slug.toLowerCase() : null;
							const destination =
								sportSlug && tournamentSlug && eventSlug
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
											{event.tournament_name && <Badge variant="secondary">{event.tournament_name}</Badge>}
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

			<div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
				<p className="text-sm text-muted-foreground">
					This city landing page will power geo-targeted SEO. Expand it with sport filters, seasonal calendars,
					and editorial travel content for premium fan experiences.
				</p>
				<div className="space-y-2">
					<p className="text-sm font-semibold">Featured venues</p>
					<ul className="list-disc pl-5 space-y-1 text-sm">
						{venues.length === 0 ? (
							<li className="text-muted-foreground">No venues attached yet — integrate Supabase venue data.</li>
						) : (
							venues.map((venue, index) => (
								<li key={venue.slug ?? venue.official_name ?? String(index)}>
									{venue.slug ? (
										<Link href={buildVenuePath(venue.slug)} className="text-primary hover:underline">
											{venue.official_name ?? slugToTitle(venue.slug, "Venue")}
										</Link>
									) : (
										<span>{venue.official_name ?? "Unnamed venue"}</span>
									)}
								</li>
							))
						)}
					</ul>
				</div>
				<Link
					href={buildGeoCountryRoute(countrySlug)}
					className="inline-flex text-sm font-medium text-primary hover:underline"
				>
					Browse all {countryName} cities
				</Link>
			</div>
		</div>
	);
}


