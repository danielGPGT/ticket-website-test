import { NextResponse } from "next/server";
import { createSitemapIndex } from "@/lib/sitemap";

export const runtime = "edge";

const SITEMAP_PATHS = [
	"/sitemap-sports.xml",
	"/sitemap-tournaments.xml",
	"/sitemap-events.xml",
	"/sitemap-venues.xml",
	"/sitemap-geo.xml",
];

export async function GET() {
	const now = new Date().toISOString();
	const xml = createSitemapIndex(
		SITEMAP_PATHS.map((path) => ({
			path,
			lastmod: now,
		})),
	);

	return new NextResponse(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}


