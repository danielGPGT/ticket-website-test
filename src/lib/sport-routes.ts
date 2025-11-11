/**
 * Sport route utilities
 */

export const SPORT_PATHS: Record<string, string> = {
	formula1: "/formula-1",
	football: "/football",
	motogp: "/motogp",
	tennis: "/tennis",
};

export const PATH_TO_SPORT: Record<string, string> = {
	"/formula-1": "formula1",
	"/football": "football",
	"/motogp": "motogp",
	"/tennis": "tennis",
};

/**
 * Gets the sport path from a sport type
 */
export function getSportPath(sportType?: string | null): string | null {
	if (!sportType) return null;
	const normalized = sportType.toLowerCase();
	return SPORT_PATHS[normalized] ?? `/${normalized}`;
}

/**
 * Gets the sport type from a pathname
 */
export function getSportFromPath(pathname: string): string | null {
	if (!pathname) return null;
	const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
	if (PATH_TO_SPORT[normalizedPath]) {
		return PATH_TO_SPORT[normalizedPath];
	}
	const dynamicSlug = normalizedPath.slice(1);
	return dynamicSlug ? dynamicSlug.toLowerCase() : null;
}

/**
 * Checks if a pathname is a sport page
 */
export function isSportPage(pathname: string): boolean {
	return getSportFromPath(pathname) !== null;
}

/**
 * Resolves the internal sport type identifier (e.g. "formula1") from a route slug (e.g. "formula-1")
 */
export function resolveSportTypeFromSlug(slug: string | null | undefined): string | null {
	if (!slug) return null;
	const normalized = slug.toLowerCase().replace(/^\//, "");
	const asPath = `/${normalized}`;
	if (PATH_TO_SPORT[asPath]) {
		return PATH_TO_SPORT[asPath];
	}
	if (SPORT_PATHS[normalized]) {
		return normalized;
	}
	// Fallback: remove dashes to align with common identifier format (e.g. formula-1 -> formula1)
	const withoutDashes = normalized.replace(/-/g, "");
	return withoutDashes || null;
}

/**
 * Resolves a public-facing slug for a sport type (e.g. "formula1" -> "formula-1")
 */
export function resolveDynamicSportSlug(sportType: string | null | undefined): string | null {
	if (!sportType) return null;
	const normalized = String(sportType).toLowerCase().trim();
	if (!normalized) return null;

	if (SPORT_PATHS[normalized]) {
		return SPORT_PATHS[normalized].replace(/^\//, "");
	}

	if (normalized.includes("-")) {
		return normalized;
	}

	// Replace digits with hyphen-digit (slug style) for common patterns like formula1 -> formula-1
	const withHyphenBeforeDigits = normalized.replace(/(\d+)/g, (match) => `-${match}`);
	return withHyphenBeforeDigits.startsWith("-") ? withHyphenBeforeDigits.slice(1) : withHyphenBeforeDigits;
}

