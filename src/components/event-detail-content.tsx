"use client";

import { groupTickets, formatTicketType } from "@/lib/xs2-api";
import { TicketGroupRow } from "@/components/ticket-group-row";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";
import { Calendar, MapPin, Clock, Trophy, ArrowLeft, Flame, ShoppingCart, Tv, Umbrella, Hash } from "lucide-react";
import Link from "next/link";
import { EventImageWithFallback } from "@/components/event-image-with-fallback";
import { SectionHeader } from "@/components/section-header";
import { getCountryName } from "@/lib/country-flags";
import { VenueMap } from "@/components/venue-map";

type EventDetailContentProps = {
	event: any;
	tickets: any[];
	categories: any[];
	sportPath?: string; // e.g., "/formula-1" for sport-specific pages
};

function formatDateRange(startDate?: string, endDate?: string): string {
	if (!startDate) return "";
	
	try {
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : null;
		
		if (!end) {
			return new Intl.DateTimeFormat(undefined, { 
				day: "numeric", 
				month: "short", 
				year: "numeric" 
			}).format(start);
		}
		
		const startDay = start.toDateString();
		const endDay = end.toDateString();
		
		if (startDay === endDay) {
			return new Intl.DateTimeFormat(undefined, { 
				day: "numeric", 
				month: "short", 
				year: "numeric" 
			}).format(start);
		}
		
		if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
			const startDay = start.getDate();
			const startMonth = new Intl.DateTimeFormat(undefined, { month: "short" }).format(start);
			const endDay = end.getDate();
			const year = start.getFullYear();
			return `${startDay} ${startMonth} - ${endDay} ${startMonth} ${year}`;
		}
		
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
		return startDate;
	}
}

function formatTime(dateStr?: string): string {
	if (!dateStr) return "";
	try {
		const date = new Date(dateStr);
		return date.toLocaleTimeString(undefined, { 
			hour: "2-digit", 
			minute: "2-digit",
			hour12: false 
		});
	} catch {
		return "";
	}
}

function getEventStatus(event: any): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
	const status = String(event.event_status ?? "").toLowerCase();
	const numberOfTickets = event.number_of_tickets ?? 0;
	
	if (status === "soldout" || status === "closed") {
		return { label: "Sales Closed", variant: "destructive" };
	}
	if (status === "cancelled" || status === "postponed") {
		return { label: status === "cancelled" ? "Cancelled" : "Postponed", variant: "destructive" };
	}
	if (numberOfTickets > 0) {
		return { label: "On Sale", variant: "default" };
	}
	return { label: "Coming Soon", variant: "secondary" };
}

export function EventDetailContent({ event, tickets, categories, sportPath }: EventDetailContentProps) {
	if (!event) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-20 text-center">
						<p className="text-lg font-semibold text-foreground mb-2">Event not found</p>
						<p className="text-sm text-muted-foreground mb-4">
							The event you're looking for doesn't exist or has been removed.
						</p>
						<Link href={sportPath || "/events"}>
							<Button variant="outline">Back to Events</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	const eventName = event.name ?? event.event_name ?? event.official_name ?? "Event";
	const eventDate = event.date_start ?? event.date_start_main_event;
	const eventDateEnd = event.date_stop ?? event.date_stop_main_event;
    const venue = event.venue_name ?? event.venue;
    const venueId = event.venue_id ?? event.venueId;
	const city = event.city;
	const countryCode = event.iso_country ?? event.country;
	const sportType = event.sport_type;
    const tournamentName = event.tournament_name;
    const isPopular = event.is_popular === true || event.popular === true;
    // Normalize min price (API may return in cents). If very large (>1000), divide by 100.
    const minPriceRaw = event.min_ticket_price_eur ?? event.min_price_eur;
    const minPrice = typeof minPriceRaw === "number"
        ? (minPriceRaw > 1000 ? minPriceRaw / 100 : minPriceRaw)
        : undefined;
	const statusInfo = getEventStatus(event);

	// Category metadata
	type CategoryMeta = { name: string; partySizeTogether?: number | null; categoryType?: string; descriptionEN?: string };
	const categoryIdToMeta = new Map<string, CategoryMeta>(
		categories.map((c: any) => [
			String(c.category_id ?? c.id),
			{
				name: String(c.category_name ?? c.official_name ?? c.name ?? c.slug ?? "Category"),
				partySizeTogether: c.party_size_together ?? null,
				categoryType: c.category_type ?? undefined,
				descriptionEN: typeof c.description === "object" ? (c.description.en_GB ?? c.description.en ?? undefined) : undefined,
			},
		])
	);

	// Full category lookup for options/extra fields
	const categoryIdToFull = new Map<string, any>(
		categories.map((c: any) => [String(c.category_id ?? c.id), c])
	);

	// Group tickets
	const groups = groupTickets(
		tickets.map((t: any) => {
			const ticketId = String(t.ticket_id ?? t.id ?? "");
			const eventIdVal = String(t.event_id ?? event.id);
			const categoryId = String(t.category_id ?? t.category?.id ?? "unknown");
			const subCategory = String(t.sub_category ?? t.subCategory ?? "regular");

			let priceEur = 0;
			if (t.local_rates?.net_rate_eur) {
				priceEur = Number(t.local_rates.net_rate_eur) / 100;
			} else if (t.local_rates?.face_value_eur) {
				priceEur = Number(t.local_rates.face_value_eur) / 100;
			} else {
				const rawPrice = Number(t.net_rate ?? t.face_value ?? t.sales_price ?? t.price ?? t.amount ?? 0);
				priceEur = rawPrice / 100;
			}

			const stock = Number(t.stock ?? t.quantity ?? 0);

			return {
				id: ticketId,
				event_id: eventIdVal,
				category_id: categoryId,
				sub_category: subCategory,
				price: priceEur,
				stock,
			};
		})
	);

	// Group by category for UI sections
	const categoryIdToGroups = new Map<string, typeof groups>();
	for (const g of groups) {
		const meta = categoryIdToMeta.get(g.category_id);
		const categoryName = meta?.name?.trim();
		if (!categoryName || categoryName.toLowerCase() === "category") continue;
		const arr = categoryIdToGroups.get(g.category_id) ?? [] as any;
		arr.push(g);
		categoryIdToGroups.set(g.category_id, arr);
	}

	// Sort groups inside each category by typical race days order
	const weight = (sub: string) => {
		const s = sub.toLowerCase();
		if (s.includes("fri")) return 1;
		if (s.includes("sat")) return 2;
		if (s.includes("sun")) return 3;
		if (s.includes("weekend")) return 4;
		return 9;
	};
	for (const [cid, arr] of categoryIdToGroups) {
		arr.sort((a: any, b: any) => weight(a.sub_category) - weight(b.sub_category) || a.min_price - b.min_price);
	}

	const backUrl = sportPath || "/events";

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<div className="relative h-[280px] sm:h-[320px] overflow-hidden">
				<EventImageWithFallback
					eventId={event.id ?? event.event_id}
					sportType={sportType}
					event={event}
					alt={eventName}
					fill
					priority
					className="object-cover"
					style={{ objectPosition: 'center 80%' }}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
				
				{/* Content Overlay */}
				<div className="container mx-auto px-4 sm:px-6 relative h-full flex flex-col justify-end pb-6">
					<Link 
						href={backUrl} 
						className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-4 transition-colors group w-fit"
					>
						<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
						Back to Events
					</Link>
					
					<div className="flex flex-wrap items-center gap-2 mb-3">
						{isPopular && (
							<Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
								<Flame className="w-3 h-3" />
								<span>Popular</span>
							</Badge>
						)}
						<Badge variant={statusInfo.variant} className="px-2.5 py-0.5 text-xs">
							{statusInfo.label}
						</Badge>
					</div>
					
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
						{eventName}
					</h1>
					
					<div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/90">
						{eventDate && (
							<div className="flex items-center gap-1.5">
								<Calendar className="w-3.5 h-3.5 shrink-0" />
								<span>{formatDateRange(eventDate, eventDateEnd)}</span>
							</div>
						)}
						{venue && (
							<div className="flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 shrink-0" />
								<span>{venue}{city ? `, ${city}` : ""}</span>
								{countryCode && (
									<>
										<CountryFlag countryCode={countryCode} size={14} />
										<span className="text-xs">{getCountryName(countryCode)}</span>
									</>
								)}
							</div>
						)}
						{tournamentName && (
							<div className="flex items-center gap-1.5">
								<Trophy className="w-3.5 h-3.5 shrink-0" />
								<span>{tournamentName}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-6 sm:py-8">
				{/* Dynamic Event Header with Promotional Content */}
				<SectionHeader
					title={(() => {
						const year = eventDate ? (() => {
							try {
								return new Date(eventDate).getFullYear();
							} catch {
								return new Date().getFullYear();
							}
						})() : new Date().getFullYear();
						return `Book ${eventName} ${year} Tickets`;
					})()}
					subtitle={(() => {
						// Generate dynamic promotional paragraphs using API data
						const getSportDisplayName = () => {
							if (!sportType) return "";
							const sportMap: Record<string, string> = {
								formula1: "Formula 1",
								formula_1: "Formula 1",
								football: "Football",
								soccer: "Football",
								motogp: "MotoGP",
								moto_gp: "MotoGP",
								tennis: "Tennis",
							};
							return sportMap[sportType.toLowerCase()] || sportType;
						};

						const year = eventDate ? (() => {
							try {
								return new Date(eventDate).getFullYear();
							} catch {
								return new Date().getFullYear();
							}
						})() : new Date().getFullYear();

						const location = [city, countryCode && getCountryName(countryCode)].filter(Boolean).join(", ");
						const sportDisplay = getSportDisplayName();
						const status = String(event.event_status ?? "").toLowerCase();
						const numberOfTickets = event.number_of_tickets ?? 0;
						const hasTickets = numberOfTickets > 0 && status !== "soldout" && status !== "closed";

						// Build first paragraph
						let paragraph1 = "";
						if (tournamentName && venue) {
							paragraph1 = `Experience the excitement of ${tournamentName} at the iconic ${venue}${city ? ` in ${city}` : ""}${countryCode ? `, ${getCountryName(countryCode)}` : ""}. ${eventName} ${year} promises to deliver unforgettable moments for fans of ${sportDisplay || "elite sports"}.`;
						} else if (tournamentName) {
							paragraph1 = `Don't miss out on ${tournamentName} as ${eventName} ${year} brings world-class competition${location ? ` to ${location}` : ""}. This premier event showcases the best in ${sportDisplay || "elite sports"} and offers an unparalleled experience for spectators.`;
						} else if (venue) {
							paragraph1 = `Join us at ${venue}${city ? ` in ${city}` : ""}${countryCode ? `, ${getCountryName(countryCode)}` : ""} for ${eventName} ${year}. This highly anticipated event${sportDisplay ? ` on the ${sportDisplay} calendar` : ""} promises to deliver thrilling action and unforgettable memories.`;
						} else {
							paragraph1 = `${eventName} ${year} is set to be one of the most exciting events${sportDisplay ? ` on the ${sportDisplay} calendar` : ""}${location ? ` in ${location}` : ""}. Don't miss your chance to witness world-class competition and experience the electric atmosphere.`;
						}

						// Build second paragraph
						let paragraph2 = "";
						if (hasTickets && minPrice && minPrice > 0) {
							paragraph2 = `Tickets for ${eventName} ${year} are now available! Secure your place today from just £${minPrice.toFixed(0)} and be part of this incredible sporting spectacle${venue ? ` at ${venue}` : ""}. Book now to guarantee your spot at one of the most anticipated events of the year.`;
						} else if (hasTickets) {
							paragraph2 = `Tickets for ${eventName} ${year} are now on sale! Book yours today to ensure you're there to experience the magic${venue ? ` of ${venue}` : ""}${location ? ` in ${location}` : ""}. Don't wait - secure your tickets now and be part of this unforgettable ${sportDisplay || "sporting"} experience.`;
						} else {
							paragraph2 = `${eventName} ${year}${venue ? ` at ${venue}` : ""}${location ? ` in ${location}` : ""} is set to be an unmissable event. Register your interest or join our waiting list to be notified when tickets become available for this premier ${sportDisplay || "sporting"} occasion.`;
						}

						return `${paragraph1} ${paragraph2}`;
					})()}
					subtitleClassName="max-w-none"
					action={(() => {
						const status = String(event.event_status ?? "").toLowerCase();
						const numberOfTickets = event.number_of_tickets ?? 0;
						const hasTickets = numberOfTickets > 0 && status !== "soldout" && status !== "closed";
						
						if (hasTickets) {
							return {
								label: minPrice && minPrice > 0 
									? `Book Now from £${minPrice.toFixed(0)}`
									: "Book Now",
								href: "#tickets" // Scroll to tickets section
							};
						} else if (status === "soldout" || status === "closed") {
							return undefined; // No action for sold out events
						} else {
							return {
								label: "Request Tickets",
								href: "#tickets"
							};
						}
					})()}
					className="mb-8"
				/>

				{/* Two Column Layout: Tickets (Left) | Venue Map (Right) */}
				<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
					{/* Left Column: Tickets Section */}
					<div id="tickets" className="lg:col-span-2 space-y-6 scroll-mt-8">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b">
							<h2 className="text-xl md:text-xl font-bold text-foreground">Available Tickets</h2>
							{groups.length > 0 && (
								<Badge variant="secondary" className="text-sm w-fit">
									{groups.length} {groups.length === 1 ? "option" : "options"}
								</Badge>
							)}
						</div>
						
					{(() => {
						// Build map: category_type -> list of [categoryId, ticketGroups]
						const typeToEntries = new Map<string, Array<[string, any[]]>>();
						for (const [categoryId, arr] of categoryIdToGroups.entries()) {
							const meta = categoryIdToMeta.get(categoryId);
							const typeKey = String(meta?.categoryType ?? "other").toLowerCase();
							const list = typeToEntries.get(typeKey) ?? [];
							list.push([categoryId, arr]);
							typeToEntries.set(typeKey, list);
						}

						const typeOrder = [
							"grandstand",
							"hospitality",
							"generaladmission",
							"camping",
							"carparking",
							"busparking",
							"transfer",
							"extras",
							"offsite_hospitality",
							"other",
						];

						const labelFor = (k: string) => {
							const map: Record<string, string> = {
								grandstand: "Grandstands",
								hospitality: "Hospitality",
								generaladmission: "General Admission",
								camping: "Camping",
								carparking: "Car Parking",
								busparking: "Bus Parking",
								transfer: "Transfers",
								extras: "Extras",
								offsite_hospitality: "Offsite Hospitality",
								other: "Other",
							};
							return map[k] ?? k;
						};

						return (
							<Accordion type="single" collapsible className="w-full space-y-2">
								{typeOrder.filter((t) => typeToEntries.has(t)).map((typeKey) => {
									// Calculate minimum price across all categories in this type
									const entries = typeToEntries.get(typeKey)!;
									const allPrices: number[] = [];
									for (const [, arr] of entries) {
										for (const g of arr) {
											const price = Number(g.min_price ?? Number.POSITIVE_INFINITY);
											if (isFinite(price)) {
												allPrices.push(price);
											}
										}
									}
									const typeMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : Number.POSITIVE_INFINITY;
									
									return (
									<AccordionItem key={typeKey} value={typeKey} className="border-none rounded-md overflow-hidden data-[state=open]:bg-primary data-[state=open]:text-primary-foreground transition-colors group">
										<AccordionTrigger className="px-4 py-4 bg-card hover:no-underline data-[state=open]:bg-primary data-[state=open]:text-primary-foreground transition-colors group">
											<div className="flex items-center justify-between w-full gap-3 pr-2">
												<span className="text-base font-semibold">{labelFor(typeKey)}</span>
												{isFinite(typeMinPrice) && (
													<span className="text-xs sm:text-sm shrink-0 group-data-[state=open]:text-primary-foreground/90">
														From £{typeMinPrice.toFixed(0)} per person
													</span>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent className="p-2 pb-0">
											<Accordion type="single" collapsible className="w-full space-y-1">
												{typeToEntries.get(typeKey)!.map(([categoryId, arr]) => {
													const meta = categoryIdToMeta.get(categoryId);
													const displayName = meta?.name?.trim();
													if (!displayName) return null;
													const fromPrice = Math.min(
														...arr.map((g: any) => Number(g.min_price ?? Number.POSITIVE_INFINITY))
													);
													return (
														<Card 
															key={categoryId}
															data-event-id={String(event.id ?? event.event_id ?? "")}
															data-category-id={categoryId}
															className="overflow-hidden border-none transition-all hover:shadow-md p-0 rounded-sm"
														>
															<AccordionItem value={categoryId} className="border-0">
																<AccordionTrigger className="px-3 sm:px-4 py-2 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border">
																	<div className="flex items-center justify-between w-full gap-2 pr-2">
																		<div className="flex items-center gap-2 flex-wrap">
																			<h3 className="font-semibold text-xs sm:text-sm text-foreground">{displayName}</h3>
																		</div>
																		<div className="shrink-0 text-xs sm:text-xs font-medium text-foreground">From £{isFinite(fromPrice) ? fromPrice.toFixed(0) : "-"}</div>
																	</div>
																</AccordionTrigger>
												<AccordionContent className="pt-0">
													<div className="px-3 sm:px-4 pb-3 space-y-2 mt-2">
														{/* Category small description & options */}
														{(() => {
															const full = categoryIdToFull.get(categoryId) ?? {};
															// Prefer rich HTML from API if available
															const descHtml = (() => {
																try {
																	if (full && typeof full.description === "object") {
																		return full.description.en_GB ?? full.description.en ?? "";
																	}
																	if (typeof full?.description === "string") return full.description;
																} catch {}
																return meta?.descriptionEN ?? "";
															})();
															const opts = full.options ?? {};
															const badges: Array<{ key: string; label: string; icon: any } | null> = [
																opts.videowall ? { key: "videowall", label: "Video wall", icon: Tv } : null,
																opts.covered_seat ? { key: "covered_seat", label: "Covered seat", icon: Umbrella } : null,
																opts.numbered_seat ? { key: "numbered_seat", label: "Numbered", icon: Hash } : null,
																opts.open_during_half_time ? { key: "half_time", label: "Open at halftime", icon: Clock } : null,
															];
															const timedBadges = [
																typeof opts.open_hours_before_match === "number" ? { key: "before", label: `${opts.open_hours_before_match}h before`, icon: Clock } : null,
																typeof opts.open_hours_after_match === "number" ? { key: "after", label: `${opts.open_hours_after_match}h after`, icon: Clock } : null,
															].filter(Boolean) as Array<{ key: string; label: string; icon: any }>;

															return (
																<div className="space-y-2">
																	{descHtml && (
																		<div 
																			className="text-xs text-muted-foreground leading-relaxed [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-0.5 [&_u]:underline [&_strong]:font-semibold"
																			dangerouslySetInnerHTML={{ __html: String(descHtml) }}
																		/>
																	)}
																	{(badges.filter(Boolean).length > 0 || timedBadges.length > 0) && (
																		<div className="flex flex-wrap gap-1.5">
																			{[...badges.filter(Boolean) as any[], ...timedBadges].map((b: any) => (
																				<span key={b.key} className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium bg-muted/40 border-border text-foreground">
																					<b.icon className="w-3 h-3" />
																					{b.label}
																				</span>
																		))}
																	</div>
																)}
															</div>
														);
														})()}
														<div className="space-y-2"><h4 className="text-xs mt-4 font-semibold text-foreground">Ticket Options</h4></div>
																		{arr.map((g: any) => (
																			<TicketGroupRow
																				key={`${g.event_id}-${g.category_id}-${g.sub_category}`}
																				groupKey={`${g.event_id}-${g.category_id}-${g.sub_category}`}
																				eventId={String(event.id ?? g.event_id)}
																				eventName={eventName}
																				categoryName={String(displayName)}
																				ticketType={formatTicketType(g.sub_category)}
																				minPrice={g.min_price}
																				stock={g.total_stock}
																				anyTicketId={g.tickets[0]?.id ?? `${g.event_id}-${g.category_id}`}
																				metaNote={meta?.partySizeTogether ? `Up to ${meta.partySizeTogether} together` : undefined}
																			/>
																		))}
																	</div>
																</AccordionContent>
															</AccordionItem>
													</Card>
												);
											})}
										</Accordion>
									</AccordionContent>
								</AccordionItem>
							);
							})}
						</Accordion>
					);
					})()}
						
						{groups.length === 0 && (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-20 text-center">
									<p className="text-lg font-semibold text-foreground mb-2">No tickets available</p>
									<p className="text-sm text-muted-foreground mb-4">
										Tickets for this event are currently not available. Please check back later.
									</p>
									<Link href={backUrl}>
										<Button variant="outline">Browse Other Events</Button>
									</Link>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Right Column: Venue Map */}
					{venueId && (
						<div className="lg:col-span-3">
							<div className="sticky top-6">
								<h3 className="text-lg font-semibold mb-3 text-foreground">Venue Map</h3>
								<VenueMap 
									venueId={String(venueId)} 
									eventId={String(event.id ?? event.event_id ?? "")}
									categories={categories}
									tickets={tickets}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

