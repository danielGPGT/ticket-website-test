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
	return SPORT_PATHS[sportType.toLowerCase()] ?? null;
}

/**
 * Gets the sport type from a pathname
 */
export function getSportFromPath(pathname: string): string | null {
	return PATH_TO_SPORT[pathname] ?? null;
}

/**
 * Checks if a pathname is a sport page
 */
export function isSportPage(pathname: string): boolean {
	return pathname in PATH_TO_SPORT;
}

