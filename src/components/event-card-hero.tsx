"use client";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";
import { formatTicketType } from "@/lib/xs2-api";

type Props = {
	id: string;
	name: string;
	date?: string;
	venue?: string;
	countryCode?: string | null;
	sportType?: string;
	minPrice?: number;
	imageUrl?: string;
};

function formatDate(dateStr?: string): string {
	if (!dateStr) return "";
	try {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat(undefined, { 
			month: "short", 
			day: "numeric", 
			year: "numeric" 
		}).format(date);
	} catch {
		return dateStr;
	}
}

export function EventCardHero({ id, name, date, venue, countryCode, sportType, minPrice, imageUrl }: Props) {
	return (
		<Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
			{imageUrl ? (
				<div className="relative h-64 overflow-hidden">
					<Image
						src={imageUrl}
						alt={name}
						fill
						className="object-cover transition-transform duration-500 group-hover:scale-105"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
				</div>
			) : (
				<div className="h-64 bg-gradient-to-br from-primary/10 via-secondary to-muted" />
			)}
			<CardContent className="absolute inset-0 flex flex-col justify-end p-6 text-white">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<CountryFlag countryCode={countryCode} size={24} className="flex-shrink-0" />
						{sportType && (
							<span className="text-xs font-medium uppercase tracking-wide px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm">
								{sportType}
							</span>
						)}
					</div>
					<h3 className="text-xl font-bold leading-tight line-clamp-2">{name}</h3>
					<div className="flex flex-col gap-1 text-sm text-white/90">
						{date && <div className="flex items-center gap-1.5">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							{formatDate(date)}
						</div>}
						{venue && <div className="flex items-center gap-1.5">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							{venue}
						</div>}
						{minPrice && <div className="text-base font-semibold mt-1">
							From €{minPrice.toFixed(0)}
						</div>}
					</div>
				</div>
				<Link href={`/events/${id}`} className="mt-4">
					<Button className="w-full" size="lg">
						View Tickets
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}

