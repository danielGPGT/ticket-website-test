import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const RESERVED_TOP_LEVEL = new Set([
	"api",
	"events",
	"venues",
	"cart",
	"checkout",
	"order",
	"geography",
	"_next",
	"favicon.ico",
	"formula-1",
	"football",
	"motogp",
	"tennis",
	"sitemap.xml",
	"sitemap-sports.xml",
	"sitemap-tournaments.xml",
	"sitemap-events.xml",
	"sitemap-venues.xml",
	"sitemap-geo.xml",
]);

function isReserved(segment: string | undefined): boolean {
	if (!segment) return true;
	return RESERVED_TOP_LEVEL.has(segment.toLowerCase());
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname === "/" || pathname === "") {
		return NextResponse.next();
	}

	if (pathname.startsWith("/_next/") || pathname.includes(".")) {
		return NextResponse.next();
	}

	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) {
		return NextResponse.next();
	}

	const [countrySlug, citySlug, venueSlug] = segments;

	if (isReserved(countrySlug)) {
		return NextResponse.next();
	}

	const url = request.nextUrl.clone();

	if (segments.length === 1) {
		url.pathname = `/geography/${countrySlug}`;
		return NextResponse.rewrite(url);
	}

	if (segments.length === 2 && !isReserved(citySlug)) {
		url.pathname = `/geography/${countrySlug}/${citySlug}`;
		return NextResponse.rewrite(url);
	}

	if (segments.length === 3 && !isReserved(citySlug) && !isReserved(venueSlug)) {
		url.pathname = `/venues/${venueSlug}`;
		return NextResponse.rewrite(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap-sports.xml|sitemap-tournaments.xml|sitemap-events.xml|sitemap-venues.xml|sitemap-geo.xml|sitemap.xml).*)",
	],
};


