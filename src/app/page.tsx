"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { HeroCarousel } from "@/components/hero-carousel";
import { getSportImage } from "@/lib/images";
import { useEffect, useState } from "react";

// Defer below-the-fold sections to reduce render-blocking JS
const PopularTournaments = dynamic(() => import("@/components/popular-tournaments").then(m => m.PopularTournaments), {
	loading: () => <div className="container mx-auto px-4 py-10"><div className="h-40 w-full rounded-md bg-muted animate-pulse" /></div>,
});

const UpcomingEventsSlider = dynamic(() => import("@/components/upcoming-events-slider").then(m => m.UpcomingEventsSlider), {
	loading: () => <div className="container mx-auto px-4 py-10"><div className="h-40 w-full rounded-md bg-muted animate-pulse" /></div>,
});

const TestimonialsSection = dynamic(() => import("@/components/testimonials-section").then(m => m.TestimonialsSection), {
	loading: () => <div className="container mx-auto px-4 py-10"><div className="h-32 w-full rounded-md bg-muted animate-pulse" /></div>,
});

const sportCategories = [
	{ id: "formula1", name: "Formula 1", description: "Grand Prix weekends and hospitality", href: "/formula-1" },
	{ id: "soccer", name: "Football", description: "Top leagues and cup fixtures", href: "/football" },
	{ id: "motogp", name: "MotoGP", description: "Race day and weekend passes", href: "/motogp" },
	{ id: "tennis", name: "Tennis", description: "Grand Slams and tours", href: "/tennis" },
];

export default function Home() {
	const [sports, setSports] = useState<Record<string, any>>({});

	useEffect(() => {
		// Fetch sports from API to get image column
		fetch("/api/xs2/sports")
			.then((r) => r.json())
			.then((d) => {
				const sportsArray = (d.sports ?? d.results ?? []) as any[];
				const sportsMap: Record<string, any> = {};
				sportsArray.forEach((sport: any) => {
					sportsMap[sport.sport_id?.toLowerCase() || ""] = sport;
				});
				setSports(sportsMap);
			})
			.catch((err) => {
				console.error("[Home] Error fetching sports:", err);
			});
	}, []);

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Carousel */}
			<HeroCarousel />


			{/* Popular Tournaments (deferred) */}
			<PopularTournaments />

			{/* Upcoming Events Slider (deferred) */}
			<UpcomingEventsSlider />

			{/* Sport Categories */}
			<section className="py-12 bg-muted/30">
				<div className="container mx-auto px-4">
					<SectionHeader
						title="Browse by Sport"
						subtitle="Explore tickets for your favorite sports"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{sportCategories.map((category) => {
							const sport = sports[category.id];
							return (
								<Link key={category.id} href={category.href}>
									<Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 py-0 cursor-pointer">
										<div className="relative h-48 overflow-hidden">
											<Image
												src={getSportImage(category.id, sport)}
												alt={category.name}
												fill
												className="object-cover transition-transform duration-500 group-hover:scale-110"
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
										</div>
										<CardContent className="absolute bottom-0 left-0 right-0 text-white p-4 overflow-hidden">
											<h3 className="text-xl font-bold mb-1">{category.name}</h3>
											<p className="text-sm text-white/90">{category.description}</p>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				</div>
			</section>

			{/* Testimonials (deferred) */}
			<TestimonialsSection />

			{/* Value Props */}
			<section className="py-12">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<Card className="border-0 shadow-md">
							<CardContent>
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
									<svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold mb-2">Verified inventory</h3>
								<p className="text-sm text-muted-foreground">
									Live availability via XS2 — no outdated listings. Every ticket is verified and ready to purchase.
								</p>
							</CardContent>
						</Card>
						<Card className="border-0 shadow-md">
							<CardContent>
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
									<svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold mb-2">Secure checkout</h3>
								<p className="text-sm text-muted-foreground">
									Stripe-powered payments and instant confirmations. Your data and transactions are protected.
								</p>
							</CardContent>
						</Card>
						<Card className="border-0 shadow-md">
							<CardContent>
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
									<svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold mb-2">World-class support</h3>
								<p className="text-sm text-muted-foreground">
									We're here through every step of your event journey. Get help when you need it.
								</p>
							</CardContent>
						</Card>
					</div>
        </div>
			</section>
    </div>
  );
}