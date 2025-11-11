import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { buildVenuePath } from "@/lib/seo";

type VenueSummary = {
	venue_id: string;
	slug: string | null;
	official_name: string | null;
	city: string | null;
	country: string | null;
	capacity: number | null;
	updated_at: string | null;
};

export const revalidate = 1800; // 30 minutes

async function fetchFeaturedVenues(): Promise<VenueSummary[]> {
	const supabase = getSupabaseAdmin();

	const { data } = await supabase
		.from("venues")
		.select("venue_id,slug,official_name,city,country,capacity,updated_at")
		.order("popular_stadium", { ascending: false })
		.order("capacity", { ascending: false })
		.limit(36)
		.returns<VenueSummary[]>();

	return data ?? [];
}

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "Venues & Stadium Guides | Apex Tickets",
		description:
			"Explore featured venues and stadiums with verified hospitality and ticket inventory across global sports.",
		openGraph: {
			title: "Venues & Stadium Guides | Apex Tickets",
			description:
				"Discover top venues around the world, from football cathedrals to premium motorsport circuits.",
		},
	};
}

export default async function VenuesPage() {
	const venues = await fetchFeaturedVenues();

	return (
		<div className="container mx-auto px-4 py-12 space-y-10">
			<SectionHeader
				title="Featured Venues"
				subtitle="Plan your matchday with stadium guides, seating insights, and premium hospitality recommendations."
			/>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{venues.map((venue) => {
					const slug = venue.slug ?? venue.venue_id;
					const href = buildVenuePath(slug);

					return (
						<Card key={venue.venue_id} className="h-full flex flex-col hover:border-primary/40 transition-colors">
							<CardHeader className="space-y-1">
								<CardTitle className="text-lg font-semibold">
									<Link href={href} className="hover:underline">
										{venue.official_name ?? "Venue"}
									</Link>
								</CardTitle>
								{venue.city && (
									<p className="text-sm text-muted-foreground">
										{venue.city}
										{venue.country ? `, ${venue.country}` : ""}
									</p>
								)}
							</CardHeader>
							<CardContent className="mt-auto">
								<ul className="text-sm text-muted-foreground space-y-1">
									{venue.capacity ? (
										<li>Capacity: {venue.capacity.toLocaleString()}</li>
									) : (
										<li>Capacity: TBC</li>
									)}
									<li>
										<Link href={href} className="text-primary font-medium hover:underline">
											View venue guide
										</Link>
									</li>
								</ul>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}


