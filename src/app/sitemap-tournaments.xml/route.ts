import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUrlSet, type UrlEntry } from "@/lib/sitemap";
import { buildTournamentPath } from "@/lib/seo";
import { getSportPath } from "@/lib/sport-routes";
import { createSlug } from "@/lib/slug";

export const runtime = "edge";

type TournamentRow = {
	tournament_id: string | null;
	slug: string | null;
	sport_type: string | null;
	updated_at: string | null;
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
	const { data } = await supabase
		.from("tournaments")
		.select("tournament_id,slug,sport_type,updated_at")
		.not("slug", "is", null)
		.limit(2000);

	const tournaments = (data as TournamentRow[] | null) ?? [];

	const entries = tournaments.reduce<UrlEntry[]>((acc, tournament) => {
		const tournamentSlug =
			typeof tournament.slug === "string" ? tournament.slug.toLowerCase() : null;
		const sportSlug = resolveSportSlug(tournament.sport_type);
		if (!tournamentSlug || !sportSlug) {
			return acc;
		}
		acc.push({
			path: buildTournamentPath(sportSlug, tournamentSlug),
			lastmod: tournament.updated_at,
			changefreq: "daily",
			priority: 0.7,
		});
		return acc;
	}, []);

	const xml = createUrlSet(entries);
	return new NextResponse(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
		},
	});
}


