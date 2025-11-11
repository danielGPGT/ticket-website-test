import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUrlSet, type UrlEntry } from "@/lib/sitemap";
import { buildCountryPath, buildCityPath } from "@/lib/seo";
import { createSlug } from "@/lib/slug";

export const runtime = "edge";

type CountryRow = { country: string | null; updated_at: string | null };
type CityRow = { city: string | null; country: string | null; updated_at: string | null };

export async function GET() {
	const supabase = getSupabaseAdmin();

	const [{ data: countryData }, { data: cityData }] = await Promise.all([
		supabase.from("countries").select("country,updated_at").limit(500),
		supabase.from("cities").select("city,country,updated_at").limit(5000),
	]);

	const countries = (countryData as CountryRow[] | null) ?? [];
	const cities = (cityData as CityRow[] | null) ?? [];

	const countryEntries = countries.reduce<UrlEntry[]>((acc, country) => {
		const slug = createSlug(country.country ?? "");
		if (!slug) {
			return acc;
		}
		acc.push({
			path: buildCountryPath(slug),
			lastmod: country.updated_at,
			changefreq: "weekly",
			priority: 0.4,
		});
		return acc;
	}, []);

	const cityEntries = cities.reduce<UrlEntry[]>((acc, city) => {
		if (!city.city || !city.country) {
			return acc;
		}
		const countrySlug = createSlug(city.country);
		const citySlug = createSlug(city.city);
		if (!countrySlug || !citySlug) {
			return acc;
		}
		acc.push({
			path: buildCityPath(countrySlug, citySlug),
			lastmod: city.updated_at,
			changefreq: "weekly",
			priority: 0.3,
		});
		return acc;
	}, []);

	const xml = createUrlSet([...countryEntries, ...cityEntries]);

	return new NextResponse(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}


