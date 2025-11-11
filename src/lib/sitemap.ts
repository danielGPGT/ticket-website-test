import { absoluteUrl } from "./seo";

export type UrlEntry = {
	path: string;
	lastmod?: string | Date | null;
	changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	priority?: number;
};

function formatLastMod(value?: string | Date | null): string | undefined {
	if (!value) return undefined;
	try {
		const date = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(date.getTime())) {
			return undefined;
		}
		return date.toISOString();
	} catch {
		return undefined;
	}
}

export function createUrlSet(entries: UrlEntry[]): string {
	const urls = entries
		.filter((entry) => entry && entry.path)
		.map((entry) => {
			const loc = absoluteUrl(entry.path);
			const lastmod = formatLastMod(entry.lastmod);
			const changefreq = entry.changefreq;
			const priority =
				typeof entry.priority === "number" && entry.priority >= 0 && entry.priority <= 1
					? entry.priority.toFixed(1)
					: undefined;

			return `
    <url>
      <loc>${loc}</loc>
      ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
      ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}
      ${priority ? `<priority>${priority}</priority>` : ""}
    </url>`.trim();
		})
		.join("\n");

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		"</urlset>",
	].join("\n");
}

export function createSitemapIndex(entries: UrlEntry[]): string {
	const sitemaps = entries
		.filter((entry) => entry && entry.path)
		.map((entry) => {
			const loc = absoluteUrl(entry.path);
			const lastmod = formatLastMod(entry.lastmod);
			return `
    <sitemap>
      <loc>${loc}</loc>
      ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    </sitemap>`.trim();
		})
		.join("\n");

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		sitemaps,
		"</sitemapindex>",
	].join("\n");
}


