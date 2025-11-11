import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUrlSet, type UrlEntry } from "@/lib/sitemap";
import { buildVenuePath } from "@/lib/seo";

export const runtime = "edge";

type VenueRow = {
	slug: string | null;
	updated_at: string | null;
};

export async function GET() {
	const supabase = getSupabaseAdmin();
	const { data } = await supabase
		.from("venues")
		.select("slug,updated_at")
		.not("slug", "is", null)
		.limit(3000);

	const venues = (data as VenueRow[] | null) ?? [];

	const entries = venues.reduce<UrlEntry[]>((acc, venue) => {
		const venueSlug = typeof venue.slug === "string" ? venue.slug.toLowerCase() : null;
		if (!venueSlug) {
			return acc;
		}
		acc.push({
			path: buildVenuePath(venueSlug),
			lastmod: venue.updated_at,
			changefreq: "weekly",
			priority: 0.5,
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


