"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionHeader } from "@/components/section-header";
import { Star, Quote } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

const testimonials = [
	{
		name: "Sarah Johnson",
		location: "London, UK",
		rating: 5,
		text: "Absolutely seamless experience from start to finish. Got tickets to the Monaco GP and the process was incredibly smooth. Highly recommend!",
		sport: "Formula 1",
	},
	{
		name: "Michael Chen",
		location: "New York, USA",
		rating: 5,
		text: "Found last-minute tickets to a Premier League match. The verification system gave me complete confidence in my purchase.",
		sport: "Football",
	},
	{
		name: "Emma Rodriguez",
		location: "Barcelona, Spain",
		rating: 5,
		text: "Wimbledon tickets delivered exactly as promised. The customer service team was responsive and helpful throughout. Will definitely use again!",
		sport: "Tennis",
	},
	{
		name: "James Wilson",
		location: "Manchester, UK",
		rating: 5,
		text: "Secured MotoGP weekend passes with ease. The secure checkout and instant confirmation made everything stress-free.",
		sport: "MotoGP",
	},
	{
		name: "Lisa Anderson",
		location: "Melbourne, Australia",
		rating: 5,
		text: "Champions League tickets were verified and delivered quickly. Trusted the platform completely and wasn't disappointed.",
		sport: "Football",
	},
	{
		name: "David Kim",
		location: "Seoul, South Korea",
		rating: 5,
		text: "Perfect tickets for the F1 Singapore Grand Prix. The XS2 verification ensures you're getting legitimate tickets every time.",
		sport: "Formula 1",
	},
];

export function TestimonialsSection() {
	return (
		<section className="py-12 bg-background">
			<div className="container mx-auto px-4">
				<SectionHeader
					title="What Our Customers Say"
					subtitle="Real experiences from sports fans worldwide"
				/>
				<Carousel
					opts={{
						align: "start",
						loop: true,
						dragFree: true,
					}}
					plugins={[
						Autoplay({
							delay: 5000,
							stopOnInteraction: false,
						}),
					]}
					className="w-full"
				>
					<CarouselContent className="-ml-2 md:-ml-4">
						{testimonials.map((testimonial, index) => (
							<CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 pb-2">
								<Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card">
									<CardContent className="h-full flex flex-col">
										<div className="flex items-center gap-1 mb-4">
											{[...Array(testimonial.rating)].map((_, i) => (
												<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
											))}
										</div>
										<Quote className="w-8 h-8 text-primary/20 mb-3" />
										<p className="text-sm text-foreground mb-4 leading-relaxed flex-grow">{testimonial.text}</p>
										<div className="pt-4 border-t border-border mt-auto">
											<div className="font-semibold text-sm">{testimonial.name}</div>
											<div className="text-xs text-muted-foreground">{testimonial.location}</div>
											<div className="mt-2">
												<span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
													{testimonial.sport}
												</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious className="hidden md:flex -left-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background" />
					<CarouselNext className="hidden md:flex -right-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background" />
				</Carousel>
			</div>
		</section>
	);
}
