import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUrlSet, type UrlEntry } from "@/lib/sitemap";
import { buildSportPath } from "@/lib/seo";
import { getSportPath } from "@/lib/sport-routes";
import { createSlug } from "@/lib/slug";

export const runtime = "edge";

type SportRow = {
	sport_id: string | null;
	updated_at: string | null;
};

function resolveSportSlug(sportId: string | null | undefined): string {
	if (sportId === null || sportId === undefined) return "";
	const normalized = String(sportId);
	if (!normalized) return "";
	const path = getSportPath(normalized) ?? `/sports/${createSlug(normalized)}`;
	return path.replace(/^\//, "");
}

export async function GET() {
	const supabase = getSupabaseAdmin();
	const { data } = await supabase
		.from("sports")
		.select("sport_id,updated_at")
		.limit(500);

	const sports = (data as SportRow[] | null) ?? [];

	const entries = sports.reduce<UrlEntry[]>((acc, sport) => {
		const slug = resolveSportSlug(sport.sport_id);
		if (!slug) {
			return acc;
		}
		acc.push({
			path: buildSportPath(slug),
			lastmod: sport.updated_at,
			changefreq: "weekly",
			priority: 0.8,
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


