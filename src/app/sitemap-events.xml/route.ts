import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUrlSet, type UrlEntry } from "@/lib/sitemap";
import { buildEventPath } from "@/lib/seo";
import { getSportPath } from "@/lib/sport-routes";
import { createSlug } from "@/lib/slug";

export const runtime = "edge";

type EventRow = {
	event_id: string | null;
	slug: string | null;
	sport_type: string | null;
	tournament_id: string | null;
	updated_at: string | null;
	date_start: string | null;
};

type TournamentRow = {
	tournament_id: string | null;
	slug: string | null;
};

function resolveSportSlug(sportType: string | null | undefined): string {
	if (sportType === null || sportType === undefined) return "";
	const normalized = String(sportType);
	if (!normalized) return "";
	const path = getSportPath(normalized) ?? `/sports/${createSlug(normalized)}`;
	return path.replace(/^\//, "");
}

export async function GET() {
	const supabase = getSupabaseAdmin();
	const { data: eventsData } = await supabase
		.from("events")
		.select("event_id,slug,sport_type,tournament_id,updated_at,date_start")
		.not("slug", "is", null)
		.limit(5000);

	const events = (eventsData as EventRow[] | null) ?? [];

	if (events.length === 0) {
		const xml = createUrlSet([]);
		return new NextResponse(xml, {
			headers: {
				"Content-Type": "application/xml",
				"Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
			},
		});
	}

	const tournamentIds = Array.from(
		new Set(events.map((event) => event.tournament_id).filter((id): id is string => Boolean(id))),
	);

	const { data: tournaments } = tournamentIds.length
		? await supabase
				.from("tournaments")
				.select("tournament_id,slug")
				.in("tournament_id", tournamentIds)
				.returns<TournamentRow[]>()
		: { data: [] as TournamentRow[] };

	const tournamentSlugById = new Map<string, string>();
	(tournaments ?? []).forEach((tournament) => {
		if (tournament.tournament_id && tournament.slug) {
			tournamentSlugById.set(tournament.tournament_id, tournament.slug.toLowerCase());
		}
	});

	const entries = events.reduce<UrlEntry[]>(
		(acc, event) => {
			const sportSlug = resolveSportSlug(event.sport_type);
			const tournamentSlug = event.tournament_id ? tournamentSlugById.get(event.tournament_id) : null;
			const eventSlug = typeof event.slug === "string" ? event.slug.toLowerCase() : null;
			if (!sportSlug || !tournamentSlug || !eventSlug) {
				return acc;
			}
			acc.push({
				path: buildEventPath(sportSlug, tournamentSlug, eventSlug),
				lastmod: event.updated_at ?? event.date_start,
				changefreq: "daily",
				priority: 0.6,
			});
			return acc;
		},
		[],
	);

	const xml = createUrlSet(entries);
	return new NextResponse(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
		},
	});
}


