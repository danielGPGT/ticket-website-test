import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	createPageMetadata,
	createBreadcrumbList,
	createPlaceSchema,
	buildVenuePath,
	buildEventPath,
	slugToTitle,
	absoluteUrl,
} from "@/lib/seo";
import { getSportPath } from "@/lib/sport-routes";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PageProps = {
	params: { venue: string };
};

type VenueRecord = {
	venue_id: string;
	official_name: string | null;
	city: string | null;
	country: string | null;
	capacity: number | null;
	latitude: string | null;
	longitude: string | null;
	streetname: string | null;
	number: string | null;
	postalcode: string | null;
	province: string | null;
	wikipedia_snippet: string | null;
};

type EventRecord = {
	event_id: string;
	event_name: string | null;
	slug: string | null;
	date_start: string | null;
	date_stop: string | null;
	sport_type: string | null;
	tournament_id: string | null;
	tournament_name: string | null;
	tournament_slug: string | null;
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

async function fetchVenueBySlug(venueSlug: string) {
	const supabase = getSupabaseAdmin();
	const { data } = await supabase
		.from("venues")
		.select(
			"venue_id,official_name,city,country,capacity,latitude,longitude,streetname,number,postalcode,province,wikipedia_snippet",
		)
		.eq("slug", venueSlug)
		.limit(1)
		.maybeSingle<VenueRecord>();

	if (!data) {
		return null;
	}

	const todayIso = new Date().toISOString();

	const { data: events } = await supabase
		.from("events")
		.select(
			"event_id,event_name,slug,date_start,date_stop,sport_type,tournament_id,tournament_name,min_ticket_price_eur,max_ticket_price_eur",
		)
		.eq("venue_id", data.venue_id)
		.gte("date_start", todayIso)
		.order("date_start", { ascending: true })
		.limit(20) as any;

	const tournamentIds = Array.from(
		new Set(
			(events ?? [])
				.map((event: any) => event?.tournament_id)
				.filter((id: string | null | undefined): id is string => Boolean(id)),
		),
	);

	const { data: tournamentSlugs } = tournamentIds.length
		? await supabase
				.from("tournaments")
				.select("tournament_id,slug")
				.in("tournament_id", tournamentIds)
		: { data: [] as Array<{ tournament_id: string; slug: string | null }> };

	const slugByTournamentId = new Map<string, string>();
	(tournamentSlugs ?? []).forEach((row) => {
		if (row.tournament_id && row.slug) {
			slugByTournamentId.set(row.tournament_id, row.slug.toLowerCase());
		}
	});

	const enrichedEvents: EventRecord[] = (events ?? []).map((event: any) => ({
		event_id: event.event_id,
		event_name: event.event_name,
		slug: event.slug,
		date_start: event.date_start,
		date_stop: event.date_stop,
		sport_type: event.sport_type,
		tournament_id: event.tournament_id,
		tournament_name: event.tournament_name,
		tournament_slug: event.tournament_id ? slugByTournamentId.get(event.tournament_id) ?? null : null,
		min_ticket_price_eur: event.min_ticket_price_eur,
		max_ticket_price_eur: event.max_ticket_price_eur,
	}));

	return {
		venue: data,
		events: enrichedEvents,
	};
}

export async function generateStaticParams() {
	return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const venueSlug = params.venue.toLowerCase();
	const result = await fetchVenueBySlug(venueSlug);

	if (!result) {
		return createPageMetadata({
			title: "Venue Not Found | Apex Tickets",
			description: "The requested venue could not be located.",
			path: buildVenuePath(venueSlug),
		});
	}

	const venueName = result.venue.official_name ?? slugToTitle(venueSlug, "Venue");
	const description = `Plan your visit to ${venueName}. View seating plans, capacity, upcoming events, and hospitality options.`;

	return createPageMetadata({
		title: `${venueName} Tickets & Venue Guide | Apex Tickets`,
		description,
		path: buildVenuePath(venueSlug),
		openGraph: {
			title: venueName,
			description,
		},
	});
}

export default async function VenuePage({ params }: PageProps) {
	const venueSlug = params.venue.toLowerCase();
	const result = await fetchVenueBySlug(venueSlug);

	if (!result) {
		notFound();
	}

	const { venue, events } = result;
	const venueName = venue.official_name ?? slugToTitle(venueSlug, "Venue");

	const breadcrumbs = createBreadcrumbList([
		{ name: "Venues", path: "/venues" },
		{ name: venueName, path: buildVenuePath(venueSlug) },
	]);

	const placeSchema = createPlaceSchema({
		name: venueName,
		url: absoluteUrl(buildVenuePath(venueSlug)),
		capacity: venue.capacity ?? undefined,
		description: venue.wikipedia_snippet ?? undefined,
		geo:
			venue.latitude && venue.longitude
				? { latitude: Number(venue.latitude), longitude: Number(venue.longitude) }
				: undefined,
		address: {
			addressLocality: venue.city ?? undefined,
			addressCountry: venue.country ?? undefined,
			addressRegion: venue.province ?? undefined,
			postalCode: venue.postalcode ?? undefined,
			streetAddress: [venue.streetname, venue.number].filter(Boolean).join(" ") || undefined,
		},
	});

	return (
		<div className="container mx-auto px-4 py-10 space-y-10">
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
			/>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
			/>

			<SectionHeader
				title={`${venueName} Tickets & Venue Guide`}
				subtitle="Real-time seating inventory, premium hospitality, and logistical insight for matchday planning."
			/>

			<Card>
				<CardHeader className="space-y-2">
					<CardTitle className="text-lg font-semibold">Venue details</CardTitle>
					<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
						{venue.city && <span>{venue.city}</span>}
						{venue.country && <span>· {venue.country}</span>}
						{venue.capacity && <Badge variant="secondary">{venue.capacity.toLocaleString()} capacity</Badge>}
					</div>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground space-y-2">
					{venue.wikipedia_snippet ? (
						<p>{venue.wikipedia_snippet}</p>
					) : (
						<p>
							We’re preparing a full venue dossier including seating guidance, hospitality tiers, and travel
							checklists. In the meantime, browse the upcoming fixtures below.
						</p>
					)}
				</CardContent>
			</Card>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Upcoming events at {venueName}</h2>
					{events.length > 0 && (
						<Badge variant="outline" className="text-xs">
							{events.length} on sale
						</Badge>
					)}
				</div>
				{events.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-sm text-muted-foreground text-center">
							No upcoming fixtures are on sale at this venue yet. Check back soon or browse all events.
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
										<CardTitle className="text-base font-semibold leading-snug">
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
											{event.tournament_name && <Badge variant="secondary">{event.tournament_name}</Badge>}
											{event.sport_type && <Badge variant="secondary">{event.sport_type.toUpperCase()}</Badge>}
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

			<Link href="/events" className="text-primary text-sm font-medium hover:underline">
				Browse all events
			</Link>
		</div>
	);
}

