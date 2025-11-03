import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PopularEventsSection } from "@/components/popular-events-section";
import { UpcomingEventsSlider } from "@/components/upcoming-events-slider";
import { StatsBanner } from "@/components/stats-banner";
import { PopularTournaments } from "@/components/popular-tournaments";
import { TestimonialsSection } from "@/components/testimonials-section";
import { SectionHeader } from "@/components/section-header";
import { HeroCarousel } from "@/components/hero-carousel";
import { HeroSearch } from "@/components/hero-search";
import { getSportImage } from "@/lib/images";

export default function Home() {
  return (
		<div className="min-h-screen bg-background">
			{/* Hero Carousel */}
			<HeroCarousel />
			{/* Popular Events Section */}
			<PopularEventsSection />

			{/* Popular Tournaments */}
			<PopularTournaments />

			{/* Upcoming Events Slider */}
			<UpcomingEventsSlider />

			{/* Sport Categories */}
			<section className="py-12 bg-muted/30">
				<div className="container mx-auto px-4">
					<SectionHeader
						title="Browse by Sport"
						subtitle="Explore tickets for your favorite sports"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						<Link href="/events?sport_type=formula1">
							<Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
								<div className="relative h-48 overflow-hidden">
									<Image
										src={getSportImage("formula1")}
										alt="Formula 1"
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
								</div>
								<CardContent className="absolute bottom-0 left-0 right-0 text-white">
									<h3 className="text-xl font-bold mb-1">Formula 1</h3>
									<p className="text-sm text-white/90">Grand Prix weekends and hospitality</p>
								</CardContent>
							</Card>
						</Link>
						<Link href="/events?sport_type=football">
							<Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
								<div className="relative h-48 overflow-hidden">
									<Image
										src={getSportImage("football")}
										alt="Football"
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
								</div>
								<CardContent className="absolute bottom-0 left-0 right-0 text-white">
									<h3 className="text-xl font-bold mb-1">Football</h3>
									<p className="text-sm text-white/90">Top leagues and cup fixtures</p>
								</CardContent>
							</Card>
						</Link>
						<Link href="/events?sport_type=motogp">
							<Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
								<div className="relative h-48 overflow-hidden">
        <Image
										src={getSportImage("motogp")}
										alt="MotoGP"
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
								<CardContent className="absolute bottom-0 left-0 right-0 text-white">
									<h3 className="text-xl font-bold mb-1">MotoGP</h3>
									<p className="text-sm text-white/90">Race day and weekend passes</p>
								</CardContent>
							</Card>
						</Link>
						<Link href="/events?sport_type=tennis">
							<Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
								<div className="relative h-48 overflow-hidden">
            <Image
										src={getSportImage("tennis")}
										alt="Tennis"
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
								</div>
								<CardContent className="absolute bottom-0 left-0 right-0 text-white">
									<h3 className="text-xl font-bold mb-1">Tennis</h3>
									<p className="text-sm text-white/90">Grand Slams and tours</p>
								</CardContent>
							</Card>
						</Link>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<TestimonialsSection />

			{/* Value Props */}
			<section className="py-16">
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
