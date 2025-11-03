"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";
import { Calendar, MapPin, Ticket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
	id: string;
	name: string;
	date?: string;
	dateEnd?: string;
	venue?: string;
	countryCode?: string | null;
	sportType?: string;
	minPrice?: number;
	maxPrice?: number;
	imageUrl?: string;
};

function formatDate(dateStr?: string): string {
	if (!dateStr) return "";
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, { 
			month: "short", 
			day: "numeric",
			year: "numeric"
		});
	} catch {
		return dateStr;
	}
}

function formatDateRange(startDate?: string, endDate?: string): string {
	if (!startDate) return "";
	
	try {
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : null;
		
		if (!end) {
			// Single date: "22 May 2026"
			return new Intl.DateTimeFormat(undefined, { 
				day: "numeric", 
				month: "short", 
				year: "numeric" 
			}).format(start);
		}
		
		// Check if same day
		const startDay = start.toDateString();
		const endDay = end.toDateString();
		
		if (startDay === endDay) {
			return new Intl.DateTimeFormat(undefined, { 
				day: "numeric", 
				month: "short", 
				year: "numeric" 
			}).format(start);
		}
		
		// Same month and year: "22 May - 24 May 2026"
		if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
			const startDay = start.getDate();
			const startMonth = new Intl.DateTimeFormat(undefined, { month: "short" }).format(start);
			const endDay = end.getDate();
			const endMonth = new Intl.DateTimeFormat(undefined, { month: "short" }).format(end);
			const year = start.getFullYear();
			return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
		}
		
		// Different months, same year: "22 May - 24 Jun 2026"
		if (start.getFullYear() === end.getFullYear()) {
			const startFormatted = new Intl.DateTimeFormat(undefined, { 
				day: "numeric", 
				month: "short" 
			}).format(start);
			const endFormatted = new Intl.DateTimeFormat(undefined, { 
				day: "numeric", 
				month: "short", 
				year: "numeric" 
			}).format(end);
			return `${startFormatted} - ${endFormatted}`;
		}
		
		// Different years: "22 May 2025 - 24 Jun 2026"
		const startFormatted = new Intl.DateTimeFormat(undefined, { 
			day: "numeric", 
			month: "short", 
			year: "numeric" 
		}).format(start);
		const endFormatted = new Intl.DateTimeFormat(undefined, { 
			day: "numeric", 
			month: "short", 
			year: "numeric" 
		}).format(end);
		return `${startFormatted} - ${endFormatted}`;
	} catch {
		return formatDate(startDate);
	}
}

const formatSportType = (sportType?: string): string => {
	if (!sportType) return "Event";
	
	const sportMap: Record<string, string> = {
		formula1: "Formula 1",
		formula_1: "Formula 1",
		motogp: "MotoGP",
		moto_gp: "MotoGP",
		tennis: "Tennis",
		football: "Football",
		soccer: "Soccer",
	};
	
	const normalized = sportType.toLowerCase().replace("_", "");
	if (sportMap[normalized]) {
		return sportMap[normalized];
	}
	
	return sportType
		.replace(/_/g, " ")
		.replace(/\b\w/g, l => l.toUpperCase());
};

export function EventCardEnhanced({ 
	id, 
	name, 
	date, 
	dateEnd,
	venue, 
	countryCode, 
	sportType,
	minPrice,
	maxPrice,
	imageUrl 
}: Props) {
	return (
		<Link href={`/events/${id}`} className="block h-full">
			<Card className="group h-full border-0 shadow-md pt-0 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-card">
				{/* Image */}
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10">
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={name}
							fill
							className="object-cover transition-transform duration-500 group-hover:scale-110"
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
						/>
					) : (
						<div className="absolute inset-0 flex items-center justify-center">
							<Ticket className="w-16 h-16 text-muted-foreground/30" />
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
					
					{/* Badges */}
					<div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
						{sportType && (
							<Badge className="bg-secondary/90 text-secondary-foreground shadow-sm">
								{formatSportType(sportType)}
							</Badge>
						)}
						{countryCode && (
							<CountryFlag countryCode={countryCode} size={24} className="shrink-0 border-2 border-background/50" />
						)}
					</div>
				</div>

				<CardContent className="space-y-3">
					{/* Event Name */}
					<h3 className="font-bold line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
						{name}
					</h3>

					{/* Date */}
					{date && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="w-4 h-4 shrink-0" />
							<span className="text-sm">{formatDateRange(date, dateEnd)}</span>
						</div>
					)}

					{/* Venue */}
					{venue && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<MapPin className="w-4 h-4 shrink-0" />
							<span className="text-sm truncate">{venue}</span>
						</div>
					)}

					{/* Price */}
					{(minPrice !== undefined || maxPrice !== undefined) && (
						<div className="pt-2 border-t border-border">
							<div className="flex items-baseline gap-2">
								<span className="text-xs text-muted-foreground">From</span>
								<span className="font-bold text-foreground text-lg">
									€{minPrice ? (minPrice / 100).toFixed(0) : maxPrice ? (maxPrice / 100).toFixed(0) : "—"}
								</span>
								{maxPrice && minPrice && maxPrice !== minPrice && (
									<span className="text-sm text-muted-foreground">
										- €{(maxPrice / 100).toFixed(0)}
									</span>
								)}
							</div>
						</div>
					)}

					{/* CTA Button */}
					<Button className="w-full" variant="default" size="lg">
						View Tickets
						<ArrowRight className="ml-2 w-4 h-4" />
					</Button>
				</CardContent>
			</Card>
		</Link>
	);
}

