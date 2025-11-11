import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	createPageMetadata,
	createBreadcrumbList,
	buildCountryPath,
	buildGeoCountryRoute,
	buildGeoCityRoute,
	buildEventPath,
	slugToTitle,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSportPath } from "@/lib/sport-routes";

type PageProps = {
	params: { country: string };
};

type CountryContext = {
	countryName: string;
	cities: Array<{ city: string }>;
	events: Array<{
		event_id: string | null;
		event_name: string | null;
		slug: string | null;
		date_start: string | null;
		date_stop: string | null;
		city: string | null;
		venue_name: string | null;
		sport_type: string | null;
		tournament_id: string | null;
		tournament_name: string | null;
		tournament_slug: string | null;
		min_ticket_price_eur: number | null;
	}>;
};

export const revalidate = 3600; // 1 hour

type CountryRow = {
	country: string | null;
};

type CityRow = {
	city: string | null;
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
	city?: string | null;
	venue_name?: string | null;
	sport_type?: string | null;
	tournament_id?: string | null;
	tournamentId?: string | null;
	tournament_name?: string | null;
	min_ticket_price_eur?: number | null;
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

async function fetchCountryContext(countrySlug: string): Promise<CountryContext | null> {
	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase
		.from("countries")
		.select("country")
		.ilike("country", slugToPattern(countrySlug))
		.limit(1)
		.single();

	if (error || !data) {
		return null;
	}

	const countryData = data as CountryRow;
	const countryName = countryData.country ?? slugToTitle(countrySlug, countrySlug);

	const { data: citiesData } = await supabase
		.from("cities")
		.select("city")
		.ilike("country", slugToPattern(countryName))
		.limit(24)
		.returns<CityRow[]>();

	const todayIso = new Date().toISOString();
	const { data: eventsData } = await supabase
		.from("events")
		.select(
			"event_id,event_name,slug,date_start,date_stop,city,venue_name,sport_type,tournament_id,tournament_name,min_ticket_price_eur",
		)
		.ilike("iso_country", slugToPattern(countryName))
		.gte("date_start", todayIso)
		.order("date_start", { ascending: true })
		.limit(20);

	const cities = (citiesData as CityRow[] | null) ?? [];
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
		countryName,
		cities: cities.map((city) => ({ city: city.city ?? "" })) ?? [],
		events: events.map((event) => ({
			event_id: event.event_id ?? event.id ?? null,
			event_name: event.event_name ?? event.name ?? null,
			slug: event.slug ?? event.event_slug ?? null,
			date_start: event.date_start ?? null,
			date_stop: event.date_stop ?? null,
			city: event.city ?? null,
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
	const context = await fetchCountryContext(countrySlug);

	if (!context) {
		return createPageMetadata({
			title: "Country Not Found | Apex Tickets",
			description: "Browse our global event catalogue to find the destination you're interested in.",
			path: buildCountryPath(countrySlug),
		});
	}

	const { countryName } = context;
	const description = `Discover sports events, venues, and hospitality packages across ${countryName}. Filter by city, sport, and season.`;

	return createPageMetadata({
		title: `${countryName} Sports Tickets & Venues | Apex Tickets`,
		description,
		path: buildCountryPath(countrySlug),
		openGraph: {
			title: `${countryName} Sports & Tickets`,
			description,
		},
	});
}

export default async function CountryPage({ params }: PageProps) {
	const countrySlug = params.country.toLowerCase();
	const context = await fetchCountryContext(countrySlug);

	if (!context) {
		notFound();
	}

	const { countryName, cities, events } = context;

	const breadcrumbs = createBreadcrumbList([{ name: countryName, path: buildGeoCountryRoute(countrySlug) }]);

	return (
		<div className="container mx-auto px-4 py-10 space-y-8">
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
			/>

			<SectionHeader
				title={`${countryName} Sports Hub`}
				subtitle={`Plan your next sports trip in ${countryName}. Choose a city to explore events, venues, and hospitality options.`}
			/>

			<div className="space-y-6">
				<Card>
					<CardHeader className="space-y-2">
						<CardTitle className="text-lg font-semibold">Upcoming events across {countryName}</CardTitle>
						{events.length > 0 && (
							<Badge variant="outline" className="w-fit text-xs">
								{events.length} on sale
							</Badge>
						)}
					</CardHeader>
					<CardContent className="space-y-4">
						{events.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								We’re waiting on ticket drops for {countryName}. As inventory syncs from XS2, events will populate here automatically.
							</p>
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
													{event.city && <Badge variant="secondary">{event.city}</Badge>}
													{event.venue_name && <Badge variant="secondary">{event.venue_name}</Badge>}
													{event.tournament_name && (
														<Badge variant="secondary">{event.tournament_name}</Badge>
													)}
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg font-semibold">Featured cities</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Select a city to see venue guides, local fixtures, and hospitality options tailored to that market.
						</p>
						<ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
							{cities.length === 0 ? (
								<li className="text-muted-foreground">
									No cities synced yet — integrate Supabase city listings.
								</li>
							) : (
								cities.map((city) => (
									<li key={city.city}>
										<Link
											href={buildGeoCityRoute(
												countrySlug,
												city.city ? city.city.toLowerCase().replace(/\s+/g, "-") : "",
											)}
											className="text-primary hover:underline"
										>
											{city.city}
										</Link>
									</li>
								))
							)}
						</ul>
						<Link
							href="/events"
							className="inline-flex text-sm font-medium text-primary hover:underline"
							prefetch={false}
						>
							Browse all events
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}


