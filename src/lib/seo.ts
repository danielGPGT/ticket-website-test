import type { Metadata } from "next";
import { createEventSlug } from "./slug";
import { getSportPath } from "./sport-routes";

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";

type Pathish = string | null | undefined;

function ensureLeadingSlash(path?: string | null): string {
	if (!path) return "/";
	return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path: Pathish): string {
	const normalizedPath = ensureLeadingSlash(path || "/");
	if (!DEFAULT_SITE_URL) {
		return normalizedPath;
	}
	return `${DEFAULT_SITE_URL}${normalizedPath}`;
}

export function buildSportPath(sportSlug: string): string {
	return ensureLeadingSlash(sportSlug);
}

export function buildTournamentPath(sportSlug: string, tournamentSlug: string): string {
	return ensureLeadingSlash(`${sportSlug}/${tournamentSlug}`);
}

export function buildEventPath(sportSlug: string, tournamentSlug: string, eventSlug: string): string {
	return ensureLeadingSlash(`${sportSlug}/${tournamentSlug}/${eventSlug}`);
}

export function buildTeamPath(sportSlug: string, teamSlug: string): string {
	return ensureLeadingSlash(`${sportSlug}/teams/${teamSlug}`);
}

export function buildVenuePath(venueSlug: string, categorySlug?: string): string {
	if (categorySlug) {
		return ensureLeadingSlash(`venues/${venueSlug}/${categorySlug}`);
	}
	return ensureLeadingSlash(`venues/${venueSlug}`);
}

export function buildCountryPath(countrySlug: string): string {
	return ensureLeadingSlash(countrySlug);
}

export function buildCityPath(countrySlug: string, citySlug: string): string {
	return ensureLeadingSlash(`${countrySlug}/${citySlug}`);
}

export function buildGeoCountryRoute(countrySlug: string): string {
	return ensureLeadingSlash(`geography/${countrySlug}`);
}

export function buildGeoCityRoute(countrySlug: string, citySlug: string): string {
	return ensureLeadingSlash(`geography/${countrySlug}/${citySlug}`);
}

export type BreadcrumbItem = {
	name: string;
	path: string;
};

export function createBreadcrumbList(items: BreadcrumbItem[]): Record<string, any> {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path),
		})),
	};
}

type OpenGraphImage = {
	url: string;
	width?: number;
	height?: number;
	alt?: string;
};

type MetadataInput = {
	title: string;
	description: string;
	path: string;
	keywords?: string[];
	openGraph?: {
		title?: string;
		description?: string;
		type?: "website" | "article" | "profile" | "event";
		images?: Array<string | OpenGraphImage>;
	};
};

export function createPageMetadata({
	title,
	description,
	path,
	keywords = [],
	openGraph,
}: MetadataInput): Metadata {
	const canonicalPath = ensureLeadingSlash(path);
	const ogImages = openGraph?.images?.map((image) =>
		typeof image === "string" ? { url: image } : image,
	);
	const allowedOgTypes: Array<"website" | "article" | "profile"> = ["website", "article", "profile"];
	const ogType = openGraph?.type && allowedOgTypes.includes(openGraph.type as any)
		? (openGraph.type as "website" | "article" | "profile")
		: "website";

	return {
		title,
		description,
		keywords: keywords.join(", "),
		alternates: {
			canonical: canonicalPath,
		},
		openGraph: {
			title: openGraph?.title ?? title,
			description: openGraph?.description ?? description,
			type: ogType,
			url: absoluteUrl(canonicalPath),
			images: ogImages,
		},
	};
}

type PostalAddress = {
	addressLocality?: string;
	addressRegion?: string;
	postalCode?: string;
	addressCountry?: string;
	streetAddress?: string;
};

type PlaceSchemaInput = {
	name: string;
	url?: string;
	geo?: {
		latitude: number | string;
		longitude: number | string;
	};
	address?: PostalAddress;
	capacity?: number;
	description?: string;
};

export function createPlaceSchema({
	name,
	url,
	geo,
	address,
	capacity,
	description,
}: PlaceSchemaInput): Record<string, any> {
	const schema: Record<string, any> = {
		"@context": "https://schema.org",
		"@type": "Place",
		name,
	};

	if (url) schema.url = url;
	if (description) schema.description = description;
	if (capacity) schema.maximumAttendeeCapacity = capacity;
	if (geo) {
		schema.geo = {
			"@type": "GeoCoordinates",
			latitude: Number(geo.latitude),
			longitude: Number(geo.longitude),
		};
	}
	if (address) {
		schema.address = {
			"@type": "PostalAddress",
			...address,
		};
	}

	return schema;
}

type OfferSchemaInput = {
	lowPrice?: number;
	highPrice?: number;
	priceCurrency?: string;
	availability?: string;
	url?: string;
	validFrom?: string;
};

type SportsEventSchemaInput = {
	name: string;
	startDate: string;
	endDate?: string;
	description?: string;
	url: string;
	venue: PlaceSchemaInput;
	offers?: OfferSchemaInput;
	performers?: Array<{ name: string; type?: "SportsTeam" | "Person" }>;
};

export function createSportsEventSchema({
	name,
	startDate,
	endDate,
	description,
	url,
	venue,
	offers,
	performers = [],
}: SportsEventSchemaInput): Record<string, any> {
	const schema: Record<string, any> = {
		"@context": "https://schema.org",
		"@type": "SportsEvent",
		name,
		startDate,
		url,
		location: createPlaceSchema({ ...venue, url: venue.url ?? url }),
	};

	if (endDate) schema.endDate = endDate;
	if (description) schema.description = description;
	if (offers) {
		schema.offers = {
			"@type": "AggregateOffer",
			priceCurrency: offers.priceCurrency ?? "EUR",
			lowPrice: offers.lowPrice,
			highPrice: offers.highPrice,
			availability: offers.availability ?? "https://schema.org/InStock",
			url: offers.url ?? url,
			validFrom: offers.validFrom,
		};
	}
	if (performers.length > 0) {
		schema.performer = performers.map((performer) => ({
			"@type": performer.type ?? "SportsTeam",
			name: performer.name,
		}));
	}
	return schema;
}

type SportsTeamSchemaInput = {
	name: string;
	sport?: string;
	url?: string;
	homeVenue?: PlaceSchemaInput;
};

export function createSportsTeamSchema({
	name,
	sport,
	url,
	homeVenue,
}: SportsTeamSchemaInput): Record<string, any> {
	const schema: Record<string, any> = {
		"@context": "https://schema.org",
		"@type": "SportsTeam",
		name,
	};

	if (sport) schema.sport = sport;
	if (url) schema.url = url;
	if (homeVenue) {
		schema.homeVenue = createPlaceSchema(homeVenue);
	}
	return schema;
}

export function slugToTitle(slug: string, fallback = "Unknown"): string {
	if (!slug) return fallback;
	return slug
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

type EventLike = {
	id?: string | null;
	event_id?: string | null;
	slug?: string | null;
	event?:
		| {
				slug?: string | null;
				event_id?: string | null;
				event_name?: string | null;
				name?: string | null;
				official_name?: string | null;
				sport_type?: string | null;
				sportType?: string | null;
		  }
		| null;
	name?: string | null;
	event_name?: string | null;
	official_name?: string | null;
	sport_type?: string | null;
	sportType?: string | null;
	tournament_id?: string | null;
	tournamentId?: string | null;
	tournament_slug?: string | null;
	tournament?: { slug?: string | null; sport_type?: string | null; sportType?: string | null } | null;
};

type ResolveEventHrefOptions = {
	sportType?: string | null;
	tournamentSlug?: string | null;
};

function normalizeSportId(value?: string | null): string | null {
	if (!value) return null;
	const normalized = String(value).toLowerCase();
	if (normalized === "soccer") return "football";
	return normalized;
}

export function resolveEventHref(event: EventLike, options: ResolveEventHrefOptions = {}): string {
	const fallbackId = event.event_id ?? event.id ?? event.event?.event_id ?? null;
	const rawTournamentSlug =
		options.tournamentSlug ??
		event.tournament?.slug ??
		event.tournament_slug ??
		(event as any)?.tournamentSlug ??
		null;

	const sportId =
		normalizeSportId(
			options.sportType ??
				event.sport_type ??
				event.sportType ??
				event.event?.sport_type ??
				event.event?.sportType ??
				event.tournament?.sport_type ??
				event.tournament?.sportType,
		) ?? null;

	const eventSlugSource =
		event.slug ??
		event.event?.slug ??
		(event as any)?.event_slug ??
		null;

	let eventSlug = eventSlugSource != null ? String(eventSlugSource).toLowerCase() : null;

	if (!eventSlug) {
		const name =
			event.event_name ??
			event.name ??
			event.official_name ??
			(event.event?.event_name ?? event.event?.name ?? event.event?.official_name) ??
			null;
		eventSlug = name ? createEventSlug({ event_name: name, event_id: fallbackId ?? undefined }) : null;
	}

	const sportPath =
		sportId !== null
			? getSportPath(sportId)?.replace(/\/+$/, "") || buildSportPath(sportId).replace(/\/+$/, "")
			: null;

	const sportSlug = sportPath ? sportPath.replace(/^\//, "") : null;
	const tournamentSlug = rawTournamentSlug != null ? String(rawTournamentSlug).toLowerCase() : null;

	if (sportSlug && tournamentSlug && eventSlug) {
		return buildEventPath(sportSlug, tournamentSlug, eventSlug);
	}

	return fallbackId ? `/events/${fallbackId}` : "/events";
}



