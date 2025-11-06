"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";
import { Clock, Bell, ArrowRight, Flame, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { createEventSlug } from "@/lib/slug";

type Props = {
	id: string;
	name: string;
	date?: string;
	dateEnd?: string;
	timeStart?: string;
	timeEnd?: string;
	venue?: string;
	countryCode?: string | null;
	sportType?: string;
	tournamentName?: string;
	city?: string;
	minPrice?: number;
	maxPrice?: number;
	status?: "available" | "cancelled" | "closed" | "notstarted" | "nosale" | "postponed" | "soldout";
	stockStatus?: "in_stock" | "coming_soon" | "out_of_stock" | "not_confirmed";
	numberOfTickets?: number;
	currency?: string;
	isPopular?: boolean;
	sportPath?: string | null; // Sport-specific path for slug-based URLs (e.g., "/formula-1")
	event?: any; // Full event object for slug generation
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

function formatTime(timeStr?: string): string {
	if (!timeStr) return "";
	try {
		// Handle ISO datetime strings
		const date = new Date(timeStr);
		if (isNaN(date.getTime())) {
			// If not a valid date, try to parse as time string
			return timeStr;
		}
		return date.toLocaleTimeString(undefined, { 
			hour: "2-digit", 
			minute: "2-digit",
			hour12: false
		});
	} catch {
		return timeStr;
	}
}

function formatDateRange(startDate?: string, endDate?: string): string {
	if (!startDate) return "";
	
	try {
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : null;
		
		if (!end || start.toDateString() === end.toDateString()) {
			return formatDate(startDate);
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
		
		// Different dates
		return `${formatDate(startDate)} - ${formatDate(endDate)}`;
	} catch {
		return formatDate(startDate);
	}
}

export function EventCardHorizontal({ 
	id, 
	name, 
	date, 
	dateEnd,
	timeStart,
	timeEnd,
	venue, 
	countryCode, 
	sportType,
	tournamentName,
	city,
	minPrice,
	maxPrice,
	status = "available",
	stockStatus,
	numberOfTickets,
	currency = "£",
	isPopular = false,
	sportPath,
	event
}: Props) {
	// Determine stock status from event status and ticket availability
	// XS2 API event_status enum: cancelled, closed, notstarted, nosale, postponed, soldout
	let actualStockStatus: "in_stock" | "coming_soon" | "out_of_stock" | "not_confirmed";
	
	if (stockStatus) {
		// Use explicitly provided stock status
		actualStockStatus = stockStatus;
	} else {
		// Normalize status to lowercase string for comparison
		const normalizedStatus = String(status || "").toLowerCase().trim();
		
		// Check if tickets are available (number_of_tickets > 0)
		const hasTickets = numberOfTickets !== undefined && numberOfTickets !== null && numberOfTickets > 0;
		
		// Map event_status enum values to stock status
		// IMPORTANT: If tickets are available, show "in_stock" even if status is "notstarted" or "nosale"
		switch (normalizedStatus) {
			case "soldout":
				actualStockStatus = "out_of_stock";
				break;
			case "closed":
				actualStockStatus = "out_of_stock";
				break;
			case "cancelled":
				actualStockStatus = "not_confirmed";
				break;
			case "postponed":
				actualStockStatus = "not_confirmed";
				break;
			case "notstarted":
				// If tickets are available, show in stock; otherwise coming soon
				actualStockStatus = hasTickets ? "in_stock" : "coming_soon";
				break;
			case "nosale":
				// If tickets are available, show in stock; otherwise coming soon
				actualStockStatus = hasTickets ? "in_stock" : "coming_soon";
				break;
			default:
				// If status is null/undefined/empty or any other value
				// Check ticket availability first, then default to in_stock
				if (hasTickets) {
					actualStockStatus = "in_stock";
				} else {
					actualStockStatus = "in_stock"; // Default assumption
				}
				break;
		}
		
		// Debug logging in development
		if (process.env.NODE_ENV === "development") {
			console.log("[EventCardHorizontal] Status mapping:", {
				rawStatus: status,
				normalizedStatus,
				numberOfTickets,
				hasTickets,
				mappedStatus: actualStockStatus
			});
		}
	}

	const isComingSoon = actualStockStatus === "coming_soon";
	const isAvailable = actualStockStatus === "in_stock";
	const isOutOfStock = actualStockStatus === "out_of_stock";
	const isNotConfirmed = actualStockStatus === "not_confirmed";

	// Generate URL - use slug-based URL if on sport page, otherwise use ID-based
	const eventUrl = sportPath && event 
		? `${sportPath}/${createEventSlug(event)}`
		: `/events/${id}`;

	return (
		<Link href={eventUrl} className="block">
			<Card className={`group border py-0 border-border/50 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-card hover:border-primary/30 ${isPopular ? 'mt-6' : ''}`}>
				<CardContent className="p-0">
					<div className="flex flex-col sm:flex-row">
						{/* Left Section - Event Info */}
						<div className="flex-1 p-4 sm:p-5 lg:p-6 relative">
							{/* Popular Badge - better mobile positioning */}
							{isPopular && (
									<><Badge 
										variant="secondary" 
										className="absolute -top-4 left-4 sm:-top-3 sm:left-6 font-semibold bg-secondary text-secondary-foreground rounded flex items-center gap-1.5 px-2 py-0.5 text-xs"
									>
										<Flame className="w-3 h-3" />
										<span className="inline">Popular</span>
									</Badge>
									<Badge 
									variant="secondary" 
									className="absolute skew-x-34 -z-1 -top-4 left-6 sm:-top-3 sm:left-8 font-semibold bg-secondary-600  text-secondary-500 rounded flex items-center gap-1.5 px-2 py-0.5 text-xs"
								>
									<Flame className="w-3 h-3" />
									<span className="inline">Popular</span>
								</Badge>
									</>
									
								
							)}
							
							{/* Country Flag - Top Right on All Screen Sizes */}
							{countryCode && (
								<div className="absolute top-4 right-4">
									<CountryFlag 
										countryCode={countryCode} 
										className="w-8 h-8 sm:w-10 sm:h-10" 
									/>
								</div>
							)}
							
							<div className="space-y-2.5 sm:space-y-3">
								{/* Event Title - Top Left, Consistent Across All Screen Sizes */}
								<h3 className="font-bold leading-tight text-foreground group-hover:text-primary transition-colors text-md sm:text-base pr-12 sm:pr-8">
									{name}
								</h3>

								{/* Date and Time Row - Below Event Name on All Screen Sizes */}
								<div className="flex items-start gap-2.5 sm:gap-3">
									<div className="flex-1 min-w-0 space-y-1">
										{/* Time - stack on mobile, inline on larger screens */}
										{(timeStart || timeEnd) && (
											<div className="flex flex-col gap-1 sm:gap-1.5 text-muted-foreground text-xs sm:text-sm">
												<div className="flex items-center gap-1.5">
													<Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
													<span className="whitespace-nowrap">
														{timeStart && timeEnd 
															? `${formatTime(timeStart)} - ${formatTime(timeEnd)}`
															: timeStart 
															? formatTime(timeStart)
															: formatTime(timeEnd)}
													</span>
												</div>
												{date && (
													<div className="flex items-center gap-1.5">
														<Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
														<span className="whitespace-nowrap">
															{formatDateRange(date, dateEnd)}
														</span>
													</div>
										
												)}
											</div>
										)}
										{/* Date only if no time */}
										{!(timeStart || timeEnd) && date && (
											<div className="text-xs sm:text-sm font-medium text-foreground">
												{formatDateRange(date, dateEnd)}
											</div>
										)}
									</div>
								</div>

								{/* Tags - more compact on mobile */}
								<div className="flex flex-wrap gap-1.5 sm:gap-2">
									{tournamentName && (
										<Badge variant="secondary" className="text-[10px] sm:text-xs font-normal bg-muted text-muted-foreground px-1.5 py-0.5">
											{tournamentName}
										</Badge>
									)}
									{venue && (
										<Badge variant="secondary" className="text-[10px] sm:text-xs font-normal bg-muted text-muted-foreground px-1.5 py-0.5">
											{venue}
										</Badge>
									)}
									{city && (
										<Badge variant="secondary" className="text-[10px] sm:text-xs font-normal bg-muted text-muted-foreground px-1.5 py-0.5">
											{city}
										</Badge>
									)}
									{countryCode && (
										<Badge variant="secondary" className="text-[10px] sm:text-xs font-normal bg-muted text-muted-foreground px-1.5 py-0.5">
											{countryCode.length === 3 ? countryCode : countryCode.toUpperCase()}
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Right Section - Price & Action */}
						<div className="relative sm:w-56 lg:w-60 px-4 sm:px-5 lg:px-6 py-4 sm:py-5 border-t sm:border-t-0 sm:border-l border-border/30 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-center gap-3 sm:gap-3 bg-transparent sm:bg-transparent">
							{/* Dashed separator - hidden on mobile, shown on desktop */}
							<div className="hidden sm:block absolute left-0 top-0 bottom-0 w-px border-l-2 my-4 border-dashed border-border/50" />
							<div className="flex flex-col items-start sm:items-center w-full space-y-2 sm:space-y-2">
								{/* Price Row - only show if in stock or not confirmed */}
								{(isAvailable || isNotConfirmed) && (
									<div className="flex items-end justify-start sm:justify-between w-full gap-2">
										<div className="flex flex-col items-start">
											<span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">From</span>
											<div className="font-bold text-foreground leading-none text-base sm:text-lg">
												{(() => {
													// Prices are in cents, so divide by 100
													// But also check if they might already be in the correct format
													let displayPrice: number | null = null;
													
													if (minPrice !== undefined && minPrice !== null && minPrice > 0) {
														// If price is very large (> 10000), it's likely in cents, divide by 100
														// If price is small (< 1000), it might already be in the correct format
														displayPrice = minPrice > 1000 ? minPrice / 100 : minPrice;
													} else if (maxPrice !== undefined && maxPrice !== null && maxPrice > 0) {
														displayPrice = maxPrice > 1000 ? maxPrice / 100 : maxPrice;
													}
													
													if (displayPrice !== null && displayPrice > 0) {
														return `${currency}${displayPrice.toFixed(0)}`;
													}
													return `${currency}—`;
												})()}
											</div>
										</div>
										{/* Stock Status Badge - hide on mobile, show on desktop */}
										{isAvailable && (
											<Badge variant="secondary" className="sm:inline-flex items-center gap-1 rounded-full mt-0.5 border" style={{ backgroundColor: 'var(--success-subtle)', borderColor: 'var(--success-border)' }}>
												<div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--success)' }} />
												<span className="font-semibold text-xs text-success" style={{ color: 'var(--success)' }}>On sale</span>
											</Badge>
										)}
										{isNotConfirmed && (
											<Badge variant="secondary" className="sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-0.5 border" style={{ backgroundColor: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
												<div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--warning)' }} />
												<span className="font-semibold text-xs dark:text-warning-100" style={{ color: 'var(--warning-900)' }}>Not confirmed</span>
											</Badge>
										)}
									</div>
								)}
								{/* Status Badge - for coming soon and sales closed (no price) - hide on mobile */}
								{isComingSoon && (
									<div className="sm:flex w-full justify-end">
										<Badge variant="secondary" className="inline-flex items-center gap-1 rounded-full mt-0.5 border" style={{ backgroundColor: 'var(--secondary-50)', borderColor: 'var(--secondary-200)' }}>
											<div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--secondary)' }} />
											<span className="font-semibold text-xs" style={{ color: 'var(--secondary)' }}>Coming soon</span>
										</Badge>
									</div>
								)}
								{isOutOfStock && (
									<div className="sm:flex w-full justify-end">
										<Badge variant="secondary" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-0.5 border" style={{ backgroundColor: 'var(--destructive-subtle)', borderColor: 'var(--destructive-border)' }}>
											<div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--destructive)' }} />
											<span className="font-semibold text-xs dark:text-destructive-100" style={{ color: 'var(--destructive-600)' }}>Sales closed</span>
										</Badge>
									</div>
								)}
							</div>

							{/* Action Button - full width on mobile, centered on desktop */}
							<div className="w-full sm:w-full mt-0 sm:mt-1">
								{isAvailable ? (
									<Button 
										className="w-full text-white text-xs sm:text-xs py-2.5 sm:py-2 h-auto font-bold shadow-sm hover:opacity-90 flex items-center justify-center gap-1.5"
										
										size="sm"
									>
										See tickets
										<ArrowRight className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
									</Button>
								) : isComingSoon || isNotConfirmed ? (
									<Button 
										variant="outline" 
										className="w-full border border-gray-300 hover:bg-gray-50 text-xs sm:text-xs py-2.5 sm:py-2 h-auto bg-white flex items-center justify-center gap-1.5"
										size="sm"
									>
										<Bell className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
										<span className="whitespace-nowrap">Request tickets</span>
									</Button>
								) : (
									<Button 
										variant="outline" 
										className="w-full border border-gray-300 hover:bg-gray-50 text-xs sm:text-xs py-2.5 sm:py-2 h-auto bg-white cursor-not-allowed opacity-50"
										size="sm"
										disabled
									>
										Sales closed
									</Button>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

