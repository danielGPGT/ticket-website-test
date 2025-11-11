import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
	createPageMetadata,
	createBreadcrumbList,
	createSportsEventSchema,
	buildSportPath,
	buildTournamentPath,
	buildEventPath,
	slugToTitle,
	absoluteUrl,
} from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { EventDetailContent } from "@/components/event-detail-content";
import { resolveDynamicSportSlug, resolveSportTypeFromSlug } from "@/lib/sport-routes";

type RouteParams = { sport: string; tournament: string; event: string };
type PageParams = {
	params: RouteParams | Promise<RouteParams>;
};

type TournamentRecord = {
	tournament_id: string;
	slug: string | null;
	sport_type: string | null;
	official_name: string | null;
	image: string | null;
	updated_at?: string | null;
};

type EventRecord = {
	event_id: string;
	event_name: string | null;
	date_start: string | null;
	date_stop: string | null;
	event_status: string | null;
	tournament_id: string | null;
	tournament_name: string | null;
	venue_id: string | null;
	venue_name: string | null;
	location_id: string | null;
	city: string | null;
	iso_country: string | null;
	latitude: string | null;
	longitude: string | null;
	sport_type: string | null;
	season: string | null;
	date_start_main_event: string | null;
	date_stop_main_event: string | null;
	min_ticket_price_eur: number | null;
	max_ticket_price_eur: number | null;
	slug: string | null;
	number_of_tickets: number | null;
	image: string | null;
	hometeam_name?: string | null;
	visiting_name?: string | null;
	event_description?: string | null;
};

type SportRecord = {
	sport_id: string;
	image: string | null;
};

export const revalidate = 3600; // 1 hour

const fetchTournamentBySlug = cache(
	async (sportSlug: string, sportType: string, tournamentSlug: string): Promise<TournamentRecord | null> => {
		const supabase = getSupabaseAdmin();
		const sportTypeCandidates = buildSportTypeCandidates(sportSlug, sportType);

		const selectBase = () =>
			supabase
				.from("tournaments")
				.select("tournament_id,slug,sport_type,official_name,image,updated_at");

		const { data } = await selectBase()
			.eq("slug", tournamentSlug)
			.in("sport_type", sportTypeCandidates)
			.maybeSingle();

		if (data) {
			return data;
		}

		const { data: fuzzyStartsWith } = await selectBase()
			.ilike("slug", `${tournamentSlug}%`)
			.in("sport_type", sportTypeCandidates)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (fuzzyStartsWith) {
			return fuzzyStartsWith;
		}

		const { data: fuzzyContains } = await selectBase()
			.ilike("slug", `%${tournamentSlug}%`)
			.in("sport_type", sportTypeCandidates)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (fuzzyContains) {
			return fuzzyContains;
		}

		const { data: fallback } = await selectBase()
			.eq("slug", tournamentSlug)
			.maybeSingle();

		return fallback ?? null;
	},
);

const fetchSportRecord = cache(async (sportSlug: string, sportType: string): Promise<SportRecord | null> => {
	const supabase = getSupabaseAdmin();
	const sportTypeCandidates = buildSportTypeCandidates(sportSlug, sportType);
	const selectBase = () =>
		supabase
			.from("sports")
			.select("sport_id,image");

	const { data } = await selectBase()
		.in("sport_id", sportTypeCandidates)
		.maybeSingle();

	if (data) return data;

	const { data: fallback } = await selectBase()
		.ilike("sport_id", `${sportSlug}%`)
		.limit(1)
		.maybeSingle();

	return fallback ?? null;
});

const EVENT_COLUMNS =
	"event_id,event_name,date_start,date_stop,event_status,tournament_id,tournament_name,venue_id,venue_name,location_id,city,iso_country,latitude,longitude,sport_type,season,tournament_type,date_confirmed,date_start_main_event,date_stop_main_event,hometeam_id,hometeam_name,visiting_id,visiting_name,created,updated,event_description,min_ticket_price_eur,max_ticket_price_eur,slug,number_of_tickets,sales_periods,is_popular,created_at,updated_at,image";

const fetchEventBySlug = cache(
	async (
		sportType: string,
		sportSlug: string,
		tournament: TournamentRecord,
		eventSlug: string,
	): Promise<EventRecord | null> => {
		const supabase = getSupabaseAdmin();
		const sportTypeCandidates = buildSportTypeCandidates(sportSlug, sportType);
		const selectBase = () =>
			supabase
				.from("events")
				.select(`${EVENT_COLUMNS},updated_at`)
				.eq("tournament_id", tournament.tournament_id);

		const { data } = await selectBase()
			.eq("slug", eventSlug)
			.in("sport_type", sportTypeCandidates)
			.maybeSingle();

		if (data) {
			return data as EventRecord;
		}

		const { data: fuzzyStartsWith } = await selectBase()
			.ilike("slug", `${eventSlug}%`)
			.in("sport_type", sportTypeCandidates)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (fuzzyStartsWith) {
			return fuzzyStartsWith as EventRecord;
		}

		const { data: fuzzyContains } = await selectBase()
			.ilike("slug", `%${eventSlug}%`)
			.in("sport_type", sportTypeCandidates)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (fuzzyContains) {
			return fuzzyContains as EventRecord;
		}

		const { data: fallback } = await selectBase()
			.eq("slug", eventSlug)
			.maybeSingle();

		return (fallback as EventRecord | null) ?? null;
	},
);

const fetchEventBySlugLoose = cache(
	async (sportSlug: string, sportType: string, eventSlug: string): Promise<EventRecord | null> => {
		const supabase = getSupabaseAdmin();
		const sportTypeCandidates = buildSportTypeCandidates(sportSlug, sportType);

		const selectBase = () =>
			supabase
				.from("events")
				.select(`${EVENT_COLUMNS},updated_at`);

		const { data } = await selectBase()
			.eq("slug", eventSlug)
			.in("sport_type", sportTypeCandidates)
			.maybeSingle();

		if (data) {
			return data as EventRecord;
		}

		const { data: fuzzyStartsWith } = await selectBase()
			.ilike("slug", `${eventSlug}%`)
			.in("sport_type", sportTypeCandidates)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (fuzzyStartsWith) {
			return fuzzyStartsWith as EventRecord;
		}

		const { data: fuzzyContains } = await selectBase()
			.ilike("slug", `%${eventSlug}%`)
			.in("sport_type", sportTypeCandidates)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (fuzzyContains) {
			return fuzzyContains as EventRecord;
		}

		const { data: fallback } = await selectBase()
			.eq("slug", eventSlug)
			.maybeSingle();

		return (fallback as EventRecord | null) ?? null;
	},
);

const fetchTournamentById = cache(async (tournamentId: string): Promise<TournamentRecord | null> => {
	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase
		.from("tournaments")
		.select("tournament_id,slug,sport_type,official_name,image,updated_at")
		.eq("tournament_id", tournamentId)
		.single();

	if (error || !data) {
		return null;
	}

	return data;
});

async function fetchTickets(eventId: string) {
	const qs = new URLSearchParams({
		event_id: eventId,
		ticket_status: "available",
		stock: "gt:0",
		page_size: "500",
	});

	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/tickets?${qs.toString()}`, {
		cache: "no-store",
	});

	if (!res.ok) {
		return [];
	}

	const data = await res.json();
	return data.tickets ?? data.results ?? data.items ?? [];
}

async function fetchCategories(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/categories?event_id=${encodeURIComponent(eventId)}`, {
		cache: "no-store",
	});
	if (!res.ok) return [];
	const data = await res.json();
	return data.categories ?? data.results ?? data.items ?? [];
}

type EventContext = {
	event: EventRecord;
	tournament: TournamentRecord;
	sport: SportRecord | null;
};

function buildSportTypeCandidates(sportSlug: string, sportType: string): string[] {
	const candidates = new Set<string>();
	const add = (value?: string | null) => {
		if (!value) return;
		const normalized = value.toLowerCase().trim();
		if (normalized) {
			candidates.add(normalized);
			candidates.add(normalized.replace(/-/g, ""));
			candidates.add(normalized.replace(/-/g, " "));
		}
	};

	add(sportType);
	add(sportSlug);

	return Array.from(candidates);
}

async function fetchEventContext(
	sportSlug: string,
	sportType: string,
	tournamentSlug: string,
	eventSlug: string,
): Promise<EventContext | null> {
	const [sport, tournament] = await Promise.all([
		fetchSportRecord(sportSlug, sportType),
		fetchTournamentBySlug(sportSlug, sportType, tournamentSlug),
	]);

	let resolvedTournament = tournament;
	let event: EventRecord | null = null;

	if (resolvedTournament) {
		event = await fetchEventBySlug(sportType, sportSlug, resolvedTournament, eventSlug);
	}

	if (!event) {
		const fallbackEvent = await fetchEventBySlugLoose(sportSlug, sportType, eventSlug);
		if (!fallbackEvent) {
			return null;
		}

		event = fallbackEvent;

		if (!resolvedTournament && event.tournament_id) {
			resolvedTournament = await fetchTournamentById(event.tournament_id);
		}
	}

	if (!resolvedTournament) {
		return null;
	}

	return { event, tournament: resolvedTournament, sport };
}

async function resolveParams(params: PageParams["params"]): Promise<RouteParams | null> {
	if (!params) return null;

	const maybePromise = params as Promise<RouteParams>;
	const resolved =
		typeof maybePromise === "object" && maybePromise !== null && typeof (maybePromise as any).then === "function"
			? await maybePromise
			: (params as RouteParams);
	if (!resolved) return null;

	const { sport, tournament, event } = resolved;
	if (typeof sport !== "string" || typeof tournament !== "string" || typeof event !== "string") {
		return null;
	}

	return { sport, tournament, event };
}

export async function generateStaticParams() {
	const supabase = getSupabaseAdmin();

	type PopularEventRow = {
		slug: string | null;
		sport_type: string | null;
		tournament_id: string | null;
		is_popular: boolean | null;
	};

	const { data: events } = await supabase
		.from("events")
		.select("slug,sport_type,tournament_id,is_popular")
		.eq("is_popular", true)
		.not("slug", "is", null)
		.limit(250)
		.returns<Array<PopularEventRow>>();

	if (!events?.length) {
		return [];
	}

	const tournamentIds = Array.from(
		new Set(events.map((event) => event.tournament_id).filter((id): id is string => typeof id === "string")),
	);

	let tournamentSlugById = new Map<string, string>();

	if (tournamentIds.length > 0) {
		const { data: tournaments } = await supabase
			.from("tournaments")
			.select("tournament_id,slug")
			.in("tournament_id", tournamentIds)
			.not("slug", "is", null)
			.limit(500)
			.returns<Array<{ tournament_id: string | null; slug: string | null }>>();

		tournamentSlugById = new Map(
			(tournaments ?? [])
				.filter((t): t is { tournament_id: string; slug: string } => Boolean(t.tournament_id && t.slug))
				.map((t) => [t.tournament_id, t.slug.toLowerCase()]),
		);
	}

	const params = new Map<string, { sport: string; tournament: string; event: string }>();

	for (const event of events) {
		const eventSlug = typeof event.slug === "string" ? event.slug.toLowerCase() : null;
		const sportSlug =
			resolveDynamicSportSlug(event.sport_type ?? "") ??
			(event.sport_type ? event.sport_type.toLowerCase() : null);
		const tournamentSlug = event.tournament_id ? tournamentSlugById.get(event.tournament_id) : null;

		if (!eventSlug || !sportSlug || !tournamentSlug) {
			continue;
		}

		const key = `${sportSlug}/${tournamentSlug}/${eventSlug}`;
		if (!params.has(key)) {
			params.set(key, {
				sport: sportSlug,
				tournament: tournamentSlug,
				event: eventSlug,
			});
		}
	}

	return Array.from(params.values());
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
	const resolved = await resolveParams(params);
	if (!resolved) {
		return createPageMetadata({
			title: "Event Not Found | Apex Tickets",
			description: "The requested event could not be found.",
			path: "/events",
		});
	}

	const sportSlug = resolved.sport.toLowerCase();
	const sportType = resolveSportTypeFromSlug(sportSlug) ?? sportSlug.replace(/-/g, "");
	const tournamentSlug = resolved.tournament.toLowerCase();
	const eventSlug = resolved.event.toLowerCase();

	const context = await fetchEventContext(sportSlug, sportType, tournamentSlug, eventSlug);
	if (!context) {
		return createPageMetadata({
			title: "Event Not Found | Apex Tickets",
			description: "The requested event could not be found.",
			path: buildEventPath(sportSlug, tournamentSlug, eventSlug),
		});
	}

	const { event, tournament } = context;
	const canonicalTournamentSlug = tournament.slug?.toLowerCase() ?? tournamentSlug;
	const canonicalEventSlug = event.slug?.toLowerCase() ?? eventSlug;
	const eventName = event.event_name ?? slugToTitle(canonicalEventSlug, "Event");
	const venueName = event.venue_name ?? "";
	const date = event.date_start ?? event.date_start_main_event ?? "";
	const description = `Secure tickets for ${eventName}${venueName ? ` at ${venueName}` : ""}. Live availability, verified seats, and premium hospitality options.`;

	return createPageMetadata({
		title: `${eventName} Tickets | ${venueName || "Official Tickets"} | Apex Tickets`,
		description,
		path: buildEventPath(sportSlug, canonicalTournamentSlug, canonicalEventSlug),
		openGraph: {
			title: eventName,
			description,
			type: "event",
		},
	});
}

export default async function EventPage({ params }: PageParams) {
	const resolved = await resolveParams(params);
	if (!resolved) {
		notFound();
	}

	const sportSlug = resolved.sport.toLowerCase();
	const sportType = resolveSportTypeFromSlug(sportSlug) ?? sportSlug.replace(/-/g, "");
	const tournamentSlug = resolved.tournament.toLowerCase();
	const eventSlug = resolved.event.toLowerCase();

	const context = await fetchEventContext(sportSlug, sportType, tournamentSlug, eventSlug);
	if (!context) {
		notFound();
	}

	const { event, tournament, sport } = context;
	const canonicalTournamentSlug = tournament.slug?.toLowerCase() ?? tournamentSlug;
	const canonicalEventSlug = event.slug?.toLowerCase() ?? eventSlug;

	if (canonicalTournamentSlug !== tournamentSlug || canonicalEventSlug !== eventSlug) {
		redirect(buildEventPath(sportSlug, canonicalTournamentSlug, canonicalEventSlug));
	}

	const [tickets, categories] = await Promise.all([
		fetchTickets(event.event_id),
		fetchCategories(event.event_id),
	]);

	const sportTitle = slugToTitle(sportSlug, sportSlug);
	const tournamentTitle = tournament.official_name ?? slugToTitle(tournamentSlug, tournamentSlug);

	const breadcrumbs = createBreadcrumbList([
		{ name: "Sports", path: "/events" },
		{ name: sportTitle, path: buildSportPath(sportSlug) },
		{ name: tournamentTitle, path: buildTournamentPath(sportSlug, canonicalTournamentSlug) },
		{
			name: event.event_name ?? slugToTitle(canonicalEventSlug, canonicalEventSlug),
			path: buildEventPath(sportSlug, canonicalTournamentSlug, canonicalEventSlug),
		},
	]);

	const schema = createSportsEventSchema({
		name: event.event_name ?? slugToTitle(canonicalEventSlug, "Event"),
		startDate: event.date_start ?? event.date_start_main_event ?? "",
		endDate: event.date_stop ?? event.date_stop_main_event ?? undefined,
		description: event.event_description ?? undefined,
		url: absoluteUrl(buildEventPath(sportSlug, canonicalTournamentSlug, canonicalEventSlug)),
		venue: {
			name: event.venue_name ?? "Venue",
			url: absoluteUrl(buildEventPath(sportSlug, canonicalTournamentSlug, canonicalEventSlug)),
			geo:
				event.latitude && event.longitude
					? {
							latitude: Number(event.latitude),
							longitude: Number(event.longitude),
					  }
					: undefined,
			address: {
				addressLocality: event.city ?? undefined,
				addressCountry: event.iso_country ?? undefined,
			},
		},
		offers:
			event.min_ticket_price_eur || event.max_ticket_price_eur
				? {
						lowPrice: Number(event.min_ticket_price_eur) || undefined,
						highPrice: Number(event.max_ticket_price_eur) || undefined,
						priceCurrency: "EUR",
						url: absoluteUrl(buildEventPath(sportSlug, canonicalTournamentSlug, canonicalEventSlug)),
				  }
				: undefined,
		performers: [
			...(event.hometeam_name ? [{ name: event.hometeam_name, type: "SportsTeam" as const }] : []),
			...(event.visiting_name ? [{ name: event.visiting_name, type: "SportsTeam" as const }] : []),
		],
	});

	return (
		<>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
			/>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
			/>
			<EventDetailContent
				event={event}
				tickets={tickets}
				categories={categories}
				sportPath={buildSportPath(sportSlug)}
				tournament={tournament}
				sport={sport}
			/>
		</>
	);
}


