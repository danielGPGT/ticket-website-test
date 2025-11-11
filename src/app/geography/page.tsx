import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { buildCountryPath, buildCityPath } from "@/lib/seo";
import { createSlug } from "@/lib/slug";

type CountrySummary = {
	country: string;
	updated_at: string | null;
};

type CitySummary = {
	city: string;
	country: string;
	updated_at: string | null;
};

export const revalidate = 3600; // 1 hour

async function fetchGeoHighlights(): Promise<{ countries: CountrySummary[]; cities: CitySummary[] }> {
	const supabase = getSupabaseAdmin();

	const [countriesRes, citiesRes] = await Promise.all([
		supabase.from("countries").select("country,updated_at").limit(24),
		supabase.from("cities").select("city,country,updated_at").limit(60),
	]);

	return {
		countries: countriesRes.data ?? [],
		cities: citiesRes.data ?? [],
	};
}

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "Destinations & City Guides | Apex Tickets",
		description:
			"Browse sports destinations by country and city. Discover upcoming events, venues, and travel recommendations worldwide.",
		openGraph: {
			title: "Destinations & City Guides | Apex Tickets",
			description:
				"Plan your next sports trip with curated country and city guides featuring upcoming fixtures and venues.",
		},
	};
}

export default async function GeographyPage() {
	const { countries, cities } = await fetchGeoHighlights();

	return (
		<div className="container mx-auto px-4 py-12 space-y-10">
			<SectionHeader
				title="Destinations"
				subtitle="Explore countries and cities with premium sports hospitality and on-sale tickets."
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
				<Card className="lg:col-span-1 h-full">
					<CardHeader>
						<CardTitle className="text-lg font-semibold">Featured Countries</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<ul className="space-y-1 text-sm">
							{countries.length === 0 ? (
								<li className="text-muted-foreground">Countries will appear here as inventory syncs.</li>
							) : (
								countries.map((country) => {
									const slug = createSlug(country.country);
									if (!slug) return null;
									return (
										<li key={country.country}>
											<Link href={buildCountryPath(slug)} className="text-primary hover:underline">
												{country.country}
											</Link>
										</li>
									);
								})
							)}
						</ul>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2 h-full">
					<CardHeader>
						<CardTitle className="text-lg font-semibold">Popular Cities</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
							{cities.length === 0 ? (
								<p className="col-span-full text-muted-foreground">
									We&apos;re curating destination guides—check back soon for city highlights.
								</p>
							) : (
								cities.map((city) => {
									const countrySlug = createSlug(city.country);
									const citySlug = createSlug(city.city);
									if (!countrySlug || !citySlug) return null;
									return (
										<Link
											key={`${city.country}-${city.city}`}
											href={buildCityPath(countrySlug, citySlug)}
											className="text-primary hover:underline"
										>
											{city.city}, {city.country}
										</Link>
									);
								})
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}


